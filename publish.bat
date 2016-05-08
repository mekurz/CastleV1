del prod\*.* /s /q

copy /b storage.js+common.js+logger.js+data_loader.js+image_cache.js+game.js+viewport.js+actor.js+mouse.js+movement.js+monsters.js+melee.js+spells.js+debug.js+MapGen\mapgen.js+inventory.js+paperdoll.js+level.js+verbs.js+widget.js+minimap.js+traps.js+spellbook.js full.js /b
copy /b full.js+new_game.js+char_info.js+status_effects.js full.js /b
"C:\Program Files (x86)\Microsoft\Microsoft Ajax Minifier\ajaxmin.exe" -clobber:y full.js -out full.min.js

copy index.prod.html prod\index.html
copy full.js prod
copy *.min.js prod
copy changelog.txt prod
copy game_data.xml prod

md prod\libs
md prod\css
md prod\html
md prod\images
md prod\test
md prod\MapGen

copy libs\*.min.js prod\libs\
xcopy css\*.* prod\css\ /e /y
xcopy html\*.* prod\html\ /e /y
copy images\*.* prod\images\

copy test\test.prod.html prod\test\test.html
copy test\qunit.* prod\test
copy test\tests.js prod\test
copy MapGen\test.html prod\MapGen

del full.js
del full.min.js