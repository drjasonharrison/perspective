/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const {execute, clean} = require("./script_utils.js");
const fs = require("fs");

try {
    // NPM publish
    execute`
        github_changelog_generator
        --token=${process.env.GITHUB_TOKEN}
        --max-issues 100
        --user finos
        --project perspective
        --unreleased-only
        --base CHANGELOG.md
        --output CHANGELOG.md
        --unreleased-label=v1.0.1
        --since-tag=v1.0.0
    `;

    execute`git add CHANGELOG.md`;

    console.log(`-- Building "@finos/perspective(-*)" ${PERSPECTIVE_VERSION}`);
    fs.writeFileSync("./.perspectiverc", `PSP_PROJECT=js`);
    execute`rm -rf node_modules`;
    execute`yarn clean --deps`;
    execute`yarn`;
    execute`yarn build`;

    execute`yarn lerna publish --force-publish --no-push`;

    // publish is run after version, so any package.json has the right version
    const pkg_json = require("@finos/perspective/package.json");
    const PERSPECTIVE_VERSION = pkg_json.version;

    // Python publish
    console.log(`-- Building "perspective-python" ${PERSPECTIVE_VERSION}`);
    fs.writeFileSync("./.perspectiverc", `PSP_PROJECT=python`);
    execute`yarn clean --deps`;
    execute`yarn build`;

    // sdist into `python/perspective/dist`, and test the sdist as well.
    execute`cd ./python/perspective && ./scripts/build_sdist.sh`;
    const sdist_name = `perspective-python-${PERSPECTIVE_VERSION}.tar.gz`;

    console.log(`-- Uploading source distribution "${sdist_name}" to PyPi"`);
    execute`cd python/perspective && python3 -m twine upload ./dist/${sdist_name}`;
} catch (e) {
    console.error(e.message);
    process.exit(1);
}
