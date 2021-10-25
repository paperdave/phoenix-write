yarn vite build .\src\builtversion\ --outDir ../../build --emptyOutDir
node .\generatefinal.mjs
copy-item static\* build\ -Recurse -Force
Pause
cd build
Compress-Archive * -Force ../build.zip
cd ..