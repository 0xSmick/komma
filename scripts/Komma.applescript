-- Stay-open applet: handles on open events even after initial on run

on run
	launchKomma()
end run

on open theFiles
	set filePath to POSIX path of item 1 of theFiles
	do shell script "echo " & quoted form of filePath & " > /tmp/komma-open-file"

	if not kommaIsRunning() then
		launchKomma()
	end if
end open

on kommaIsRunning()
	try
		do shell script "pgrep -f 'dist-electron/main.js' > /dev/null 2>&1"
		return true
	on error
		return false
	end try
end kommaIsRunning

on launchKomma()
	if not kommaIsRunning() then
		do shell script "export PATH=/opt/homebrew/bin:$HOME/Developer/doc-editor/node_modules/.bin:$PATH && cd $HOME/Developer/doc-editor && npm run electron:dev > /dev/null 2>&1 &"
	end if
end launchKomma

on idle
	-- Keep applet alive to receive future on open events (stay-open applet)
	return 600
end idle
