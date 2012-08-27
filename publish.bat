del prod\*.* /s /q

copy /b storage.js+common.js+logger.js+data_loader.js+image_cache.js+game.js+viewport.js+actor.js+mouse.js+movement.js+monsters.js+melee.js+spells.js+debug.js+MapGen\mapgen.js+inventory.js+paperdoll.js+level.js+verbs.js+widget.js+minimap.js+traps.js+spellbook.js full.js /b
copy /b full.js+new_game.js full.js /b
"C:\Program Files (x86)\Microsoft\Microsoft Ajax Minifier 4\ajaxmin.exe" -clobber:y full.js -out full.min.js

copy index.prod.html prod\index.html
copy style.css prod
copy *.min.js prod
copy changelog.txt prod
copy game_data.xml prod

copy libs\*.min.js prod\libs
xcopy css\*.* prod\css /e /y
xcopy html\*.* prod\html /e /y
xcopy images\*.* prod\images /e /y /exclude:exclude.txt

del full.js
del full.min.js