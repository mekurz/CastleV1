del prod\*.* /s /q

copy /b common.js+logger.js+image_cache.js+game.js+viewport.js+actor.js+mouse.js+movement.js+monsters.js+melee.js+spells.js+debug.js+MapGen\mapgen.js full.js /b
"C:\Program Files (x86)\Microsoft\Microsoft Ajax Minifier 4\ajaxmin.exe" -clobber:y full.js -out full.min.js

copy index.prod.html prod\index.html
copy style.css prod
copy *.min.js prod
copy changelog.txt prod
copy images\*.* prod\images

del full.js
del full.min.js