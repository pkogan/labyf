/**
 * @namespace js.sufragio.pantallas
 */

 /**
  * Muestra la pantalla de consulta de votacion.
  * 
  * @param {*} candidatos - Candidatos seleccionados.
  */
function consulta(candidatos){
    hide_dialogo();
    document.querySelector('#img_voto').innerHTML = '';
    document.querySelector('#candidatos_seleccion').innerHTML = '';
    document.querySelector('#pantalla_mensaje_final').style.display = 'none';
    if (constants.asistida) {
      document.querySelector('#pantalla_consulta .texto-mediano').style.display = 'block';
      document.querySelector('#pantalla_consulta #candidatos_seleccion').style.display = 'none';
    } else {
        var elemento = document.createElement('h2');
        elemento.style.marginTop = '200px';
        elemento.innerHTML = 'Cargando...'
        document.querySelector('#img_voto').appendChild(elemento);
    }
    candidatos_consulta(candidatos);
    patio.pantalla_consulta.only();
    setTimeout(
        function(){
            send("imagen_consulta");
        },
        100);
}

/**
 * Muestra los candidatos en la consulta de voto. Esto es, los recuadros de
 * candidatos que figuran por debajo del svg de la boleta. 
 * 
 * @param {*} candidatos - Candidatos seleccionados. 
 */
function candidatos_consulta(candidatos){
    templateClass.generar_paneles_verificacion(candidatos).then((html) => {
        document.querySelector('#candidatos_seleccion').innerHTML = html;
        homogeneizar_tarjetas_verificacion();
    });
}

function homogeneizar_tarjetas_verificacion() {
    const tarjetas_confirmacion = Array.from(
        document.getElementsByClassName("verificacion_tarjeta")
    );
    mismo_alto_de_header(tarjetas_confirmacion);

    function mismo_alto_de_header(tarjetas) {
        const headers = tarjetas.map((t) => header(t));
        inicializar_alto(headers);
        const alto_header = mayor_alto(headers);
        headers.forEach((h) => set_alto(h, alto_header));

        function inicializar_alto(headers) {
            headers.forEach((h) => set_alto(h, "auto", ""));
        }
        function mayor_alto(headers) {
            return Math.max(...headers.map((h) => alto(h)));
        }
        function header(tarjeta) {
            return tarjeta.getElementsByClassName(
                "verificacion_tarjeta-header"
            )[0];
        }
        function alto(elemento) {
            return elemento.getBoundingClientRect().height;
        }
        function set_alto(elemento, alto, medida = "px") {
            elemento.style.minHeight = `${alto}${medida}`;
        }
    }
}

/**
 * Muesta la imagen de consulta de voto en pantalla de consulta.
 * 
 * @param {*} data - un png base64 encoded.
 */
async function imagen_consulta(data){
    let muestra_html = constants.muestra_svg
    const img_voto = document.getElementById("img_voto")
    await inserta_imagen_boleta(muestra_html, img_voto, data)
}

/**
 * Muesta la imagen de consulta de voto en pantalla de agradecimiento.
 * 
 * @param {*} data - un png base64 encoded.
 */
async function mostrar_voto(data){
    if (!constants.asistida) {
        let muestra_html = constants.muestra_svg
        const img_previsualizacion = document.getElementById("img_previsualizacion")
        await inserta_imagen_boleta(muestra_html, img_previsualizacion, data)
    }
}

/**
 * Establece la palabra principal.
 */
function pantalla_principal(){
    _candidatos_adhesion = null;
    limpiar_data_categorias();

    bindear_botones();
    var pantalla = patio.pantalla_modos;
    document.querySelectorAll('.opcion-tipo-voto').forEach(
        (elem) => {
            elem.classList.remove('seleccionado');
        });
    pantalla.only();
}

/**
 * Establece la pantalla de idiomas.
 * 
 * @param {*} idiomas - Los idiomas disponibles.
 */
function pantalla_idiomas(idiomas){
    fetch_template("idioma", "pantallas/voto").then((template_idioma) => {
        var elem = document.querySelector('#opciones_idioma');
        for(var i in idiomas){
            var nombre_idioma = idiomas[i][0];
            var id_idioma = "idioma_" + idiomas[i][1];
            var data_template = {
                'id_idioma': id_idioma,
                'nombre_idioma': nombre_idioma
            };
    
            elem.innerHTML = template_idioma(data_template);
    
        }
        patio.pantalla_idiomas.only();
        bindear_botones();    
    });
}

/**
 * Establece la pantalla de insercion de boleta.
 */
function insercion_boleta(){
    if(en_menu_salida) {
        en_menu_salida = false;
    }
    var w = window.outerWidth;
    _votando = false;
    document.body.setAttribute('data-state', 'normal');

    if (w < 1400){
        var src = "img/sufragio/ingreso_boleta.png";
    }else{
        var src = "img/sufragio/ingreso_boleta1920.png";
    }

    if(constants.asistida){
      document.querySelector('#insercion_boleta .contenedor_texto h1.titulo').innerHTML = constants.titulo;
      document.querySelector('#insercion_boleta .contenedor_texto h2.subtitulo').innerHTML = constants.subtitulo;
      const subtitulo_contraste = document.querySelector('#insercion_boleta .contenedor_texto h1.subtitulo_contraste')
      if (subtitulo_contraste){
        subtitulo_contraste.innerHTML = constants.subtitulo_contraste;
      }
      const tooltip = document.querySelector('.tooltip')
      if (tooltip){
        tooltip.style.display = 'none';
      }
      if (w < 1400){
            var src = "img/sufragio/ingreso_asistida.png";
        }else{
            var src = "img/sufragio/ingreso_asistida1920.png";
        }
      send("change_screen_insercion_boleta");
      document.querySelector('#img_insercion_boleta').classList.add('asistida');
    }

    document.querySelector('#img_insercion_boleta').src = src;
    patio.insercion_boleta.only();
    send("resetear_volver_a_menu");
}

/**
 * Genera los datos a mostrar en la pantalla de seleccion de modos.
 * 
 * @returns {Object} - Json con una única clave "botones".
 */
function popular_pantalla_modos(){
    var botones = [];
    for(var i in constants.botones_seleccion_modo){
        var boton = constants.botones_seleccion_modo[i];
        var data = {};
        if(boton == "BTN_COMPLETA"){
            data.clase = "votar-lista-completa";
            data.cod_boton = boton;
            data.imagen = "votar_lista_completa";
            data.texto = "votar_lista_completa";
        } else {
            data.clase = "votar-por-categoria";
            data.cod_boton = boton;
            data.imagen = "votar_por_categoria";
            data.texto = "votar_por_categorias";
        }
        botones.push(data);
    }
    return {"botones": botones};
}

/**
 * Genera los datos a mostrar en la pantalla de seleccion del menu.
*/
function popular_pantalla_menu(){
    return {
        "asistida": constants.asistida,
        "usar_asistida": constants.usar_asistida,
    };
}

/**
 * Establece la pantalla de seleccion de modo de votacion.
 * 
 * @param {*} modos - Lista con los modos de votacion.
 */
function pantalla_modos(modos){
    var pantalla = patio.pantalla_modos;
    document.querySelectorAll('.opcion-tipo-voto').forEach(
        (elem) => {
            elem.classList.remove('seleccionado');
        });
    pantalla.only();
}

/**
 * Establece la pantalla de agradecimiento.
 */
function agradecimiento(){
    if(!confirmada){
      confirmada = true;
      limpiar_data_categorias();

      patio.pantalla_agradecimiento.only();
      if(!constants.asistida){
        var elemento = document.createElement('h2');
        elemento.innerHTML = 'Cargando...';
        elemento.marginTop = '200px';
        document.querySelector('#img_previsualizacion').appendChild(elemento);
        setTimeout(previsualizar_voto, 50);
        setTimeout(confirmar_seleccion, 100);
      }
    }
}

/**
* Establece el mensaje final.
*/
function mensaje_final(){
    patio.pantalla_mensaje_final.only();
}
