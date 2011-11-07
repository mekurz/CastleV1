del proj\*.* /s /q

copy /b common.js+logger.js+image_cache.js+game.js+viewport.js+actor.js+mouse.js+movement.js+monsters.js+melee.js+spells.js+debug.js full.js /b
"C:\Program Files (x86)\Microsoft\Microsoft Ajax Minifier 4\ajaxmin.exe" -clobber:y full.js -out full.min.js

copy index.html prod
copy style.css prod
copy *.min.js prod
copy changelog.txt prod
copy images\*.* prod\images

del full.js
del full.min.js