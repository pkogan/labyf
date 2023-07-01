from PyQt5.QtCore import QUrl
from PyQt5.QtWidgets import QApplication
from PyQt5.QtWebEngineWidgets import QWebEngineView
# Para instalar librerías ejecutar
# pip3 install PyQt5 PyQtWebEngine

if __name__ == "__main__":
    app = QApplication([])
    view = QWebEngineView()
    #view.load(QUrl("https://www.example.com"))
    #view.load(QUrl.fromLocalFile("/home/pkogan/Proyectos/labyf/experimento4.5/testshuffle.html"))
    view.load(QUrl.fromLocalFile("/home/pkogan/Proyectos/labyf/experimento4.5/testshuffle_2_parawebkit.html"))
    #view.load(QUrl.fromLocalFile("/home/pkogan/Proyectos/labyf/experimento4.5/index.html"))

    view.show()
    app.exec()