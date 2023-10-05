
import gi
import os

gi.require_version("Gtk", "3.0")
gi.require_version("WebKit2", "4.0")
from gi.repository import Gtk, WebKit2

window = Gtk.Window(
            default_width=1000,
            default_height=832
        )
webview = WebKit2.WebView()
settings = WebKit2.Settings()
webview.set_settings(settings)
settings.set_allow_file_access_from_file_urls(True)
directory = os.getcwd()
uri=directory+'/testshuffle_2_parawebkit.html'

webview.load_uri(uri=f"file://{uri}")
window.add(webview)
settings.set_enable_developer_extras(True)
window.show_all()
Gtk.main()