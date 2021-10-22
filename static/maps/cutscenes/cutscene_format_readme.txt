cutscene_format_readme

MANDATORY FLAGS

- "fps"	frames per second, always 24
-"leadsto" the next level after this cutscene

- "subsection" demarcates the beginning of a dialogue event.
	- MANDATORY FLAGS
		- "begin": timestamp [second, frame] at which to pause and wait for player, 
			unless "overridepause" is true.
	- OPTIONAL FLAGS
		- "unskippable": disable skipping. (for baked-in fades, animations, and for most timed events.)
		- "skipTo": timestamp at which to bring playhead if user skips. next "begin" by default.
		- "overridepause" do not pause at the beginning of this subsection.
		
		- "goal": an array of "correct answers" to each timed event.
		- "goaltime": time AT which goal must be met.
		- "lenient": goaltime becomes time BEFORE which goal must be met. 

		- "overrideSFX": instead of playing the default advance dialogue sound, play THIS sound instead.

OPTIONAL FLAGS:

- "bgm": filename of music to fade in with. start with silence if none.