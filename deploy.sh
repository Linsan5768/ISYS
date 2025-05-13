#!/usr/bin/env sh

# abort on errors
set -e

# build
echo "Building application..."
npm run build

# navigate to the build output directory
cd dist

# if deploying to a custom domain
# echo 'www.example.com' > CNAME

# initialize git repository if not already done
git init
git add -A
git commit -m 'Deploy to GitHub Pages'

# if you're deploying to https://<USERNAME>.github.io/<REPO>
git push -f https://github.sydney.edu.au/ISYS2110-2025-S1/CC04-05.git main:gh-pages

cd -

echo "Deployment complete!" 