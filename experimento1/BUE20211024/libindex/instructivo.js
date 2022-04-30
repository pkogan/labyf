document.addEventListener("DOMContentLoaded", inicializacion);

function inicializacion() {
    window.addEventListener("load", actualizar_estado);

    window.addEventListener("hashchange", actualizar_estado);

    function actualizar_estado() {
        //se ocultan todos los elementos "paso"
        resetear_divs();
        let element_id =
            window.location.hash.split("#").filter(Boolean)[0] || null;
        if (!element_id) {
            inicio_demo();
        } else {
            const selected = document.getElementById(element_id);
            selected.style.display = "";
        }
    }

    const element = document.querySelectorAll(".paso button.next");
    Array.from(element).forEach(function (item) {
        item.addEventListener("click", mostrar_siguiente_paso);
    });

    const buttonPrev = document.querySelectorAll("button.prev");
    Array.from(buttonPrev).forEach(function (item) {
        item.addEventListener("click", volver_demo);
    });

    const ubicacionDestino =
        document.getElementsByClassName("ubicacion-destino");
    Array.from(ubicacionDestino).forEach(function (item) {
        item.addEventListener("click", mostrar_demo_ubicacion);
    });

    document.getElementById("paso-5").addEventListener("click", mostrar_final);

    document.getElementById("reset").addEventListener("click", inicio_demo);
}

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("message", (event) => {
        console.log("Mensaje recibido en el cliente", event.data);
        if (event.data.command === "IMAGENES_CACHEADAS") {
            document.location = "/";
        } else if (event.data.command === "ERROR_CACHEANDO_IMAGENES") {
            habilitar_boton_comenzar(true);
            habilitar_boton_cargando(false);
        }
    });
}

function habilitar_boton_comenzar(habilitar) {
    document.querySelector("#btn-continuar").style.display = habilitar
        ? "inline"
        : "none";
}

function habilitar_boton_cargando(habilitar) {
    document.querySelector("#btn-continuar-loading").style.display = habilitar
        ? "inline"
        : "none";
}

function cambiar_url(paso) {
    //setear url con el valor 'paso' que se le pasa a la funcion
    let url = window.location.href.split("#")[0];
    window.location.href = url + "#" + paso;
}

function empezar_demo() {
    cambiar_url("paso-2");
    document
        .getElementById("empezar")
        .removeEventListener("click", empezar_demo);
    const TagBody = document.getElementsByTagName("body");
    Array.from(TagBody).forEach(function (item) {
        item.setAttribute("id", "");
    });
}

function mostrar_siguiente_paso(event) {
    const next = event.target.parentElement.nextElementSibling;
    if (next.getAttribute("id") != "undefined") {
        cambiar_url(next.getAttribute("id"));
    }
}

function volver_demo() {
    var ubicacion = window.localStorage.getItem("ubicacion");
    if (ubicacion != "null") {
        window.location = "sufragio.html?ubicacion=" + ubicacion;
    } else {
        cambiar_url("paso-3");
    }
}

function mostrar_demo_ubicacion(event) {
    resetear_divs();
    const ubicacion = event.target.getAttribute("id");
    window.localStorage.setItem("ubicacion", ubicacion);
    window.location = "sufragio.html?ubicacion=" + ubicacion;
}

function mostrar_final() {
    const TagBody = document.getElementsByTagName("body");
    Array.from(TagBody).forEach(function (item) {
        item.setAttribute("id", "final");
    });
    cambiar_url("agradecimiento");
    // const IdAgrad = document.getElementById("agradecimiento");
    // IdAgrad.addEventListener("load", function(event){});
}

function inicio_demo() {
    cambiar_url("");
    const TagBody = document.getElementsByTagName("body");
    Array.from(TagBody).forEach(function (item) {
        item.setAttribute("id", "final");
    });
    const bienvenido = document.getElementById("bienvenido");
    bienvenido.style.display = "";
    const empezar = document.getElementById("empezar");
    empezar.style.display = "";
    document.getElementById("empezar").addEventListener("click", empezar_demo);
}

function resetear_divs() {
    const contenedorAyuda = document.querySelectorAll(
        "#contenedor-ayuda > div"
    );
    Array.from(contenedorAyuda).forEach(function (item) {
        item.style.display = "none";
    });
    const franja = document.querySelectorAll(".franja");
    Array.from(franja).forEach(function (item) {
        item.style.display = "none";
    });
}
