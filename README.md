# EUR-USD
```
Gnome-Shell v.(45, 46, 47, 48, 49 ) Extension, for conversion of USD to TRY on the center of the top panel.
```
This extension is a modified version of https://github.com/arifesat/USD-TRY-GShell extension to show EUR to USD instead of USD to TRY.
```
# Data sources
EUR to USD quotation is downloaded from `frankfurter.app`, `exchangerate-api.com`, `awesomeapi.com.br`
```
# Licence
```
See LICENSE File
```
# How to install
```

Download via Gnome Extension Store: https://extensions.gnome.org/extension/7618/eur-usd/

or

cd /tmp && git clone https://github.com/vezza/EUR-USD-GShell.git && mv EUR-USD-Gshell eur-usd-gshell@vezza.github.com && cp -av eur-usd-gshell@vezza.github.com ~/.local/share/gnome-shell/extensions/ && gnome-shell-extension-tool --enable-extension eur-usd-gshell@vezza.github.com && rm -rf eur-usd-gshell@vezza.github.com



Last method is deprecated with the newer versions, just copy extension file to
```
~/.local/share/gnome-shell/extensions/
```
then restart GNOME Shell and run
```
gnome-extensions enable eur-usd-gshell@vezza.github.com
```
To restart GNOME Shell in X11, pressing Alt+F2 to open the Run Dialog and enter restart 
(or just r). 
In Wayland Logout and Login again.
