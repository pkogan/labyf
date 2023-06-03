'use strict';
var _templates = {};

function any(list, prop_func){
    var found = false;
    for(var i in list){
        if(prop_func !== null){
            if(prop_func(list[i])){
                found = true;
                break;
            }
        }
        else if(typeof list[i] === 'boolean' && list[i]){
                found = true;
                break;
        }
    }
    return found;
}

function place_text(data){
    /*
     * Actualiza las traducciones de los botones al div correspondiente.
     * Argumentos:
     * tuples -- es una lista de tuplas que contienen el key y la traduccion
     *   que vienen desde gettext
     */
    Object.keys(data).forEach(
        (clave) => {
            const dom_query = `#_txt_${clave}, ._txt_${clave}`;
            Array.from(
                document.querySelectorAll(dom_query)
            ).forEach(
                (elemento) => {
                    elemento.innerHTML = data[clave]
                }
            )
        }
    )
}

/** Carga el template del encabezado y lo muestra en pantalla. */
function popular_header(){
    return new Promise((resolve, reject) => {
        fetch_template("encabezado", "partials").then((template_header) => {
            var html_header = template_header({'voto': false});
            document.querySelector('#encabezado').innerHTML = html_header;
            resolve()
        }).catch((error) => {
            console.error("Error populando el encabezado: ", error);
            reject(error);
        });
    });
}

function shuffle(o){ //v1.0
    for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
}

function trimNumber(s) {
    /*
     * Trimea un numero.
     */
    while (s.substr(0,1) == '0' && s.length>1) { s = s.substr(1,9999); }
    return s;
}

function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

function load_template_comp(url){
    return new Promise((resolve, reject) => {
        fetch(url).then(
            response => response.text()
        ).then(data => {
            document.body.insertAdjacentHTML( 'beforeend', data );            
            resolve(data)
        }).catch(
            (err) => {
                console.error(url, err);
                reject(err)            
            }
        )
    })
}

/**
 * Llama a la funcion fetch_template para cada uno de los templates dados.
 * Es usada para cargar todos los templates en memoria. Con esto se logra reducir 
 * las lecturas a disco ya que las sucesivas llamadas a fetch_template tomaran los 
 * templates en memoria.
 * 
 * @param {string[]} [[]] templates - Arreglo de nombres de templates. Por default es un arreglo vacio.
 * @returns {Promise} 
 */
function load_templates(templates=[]){
    return new Promise((resolve, reject) => {
        Promise.all(
            templates.map( (template) => fetch_template(template) )
        ).then(
            () => resolve()
        ).catch((error) => {
            console.error(`Error cargando template ${template}. `, error)
            reject(error)
        });
    });
}

function cargar_templates_en_dom(){
    const templates = document.getElementsByClassName("raw_template");
    for(let i in templates){
        if(templates[i].id){
            const template_key = templates[i].id.slice(5);
            const compiled = Handlebars.compile(templates[i].innerHTML);
            _templates[template_key] = compiled;
        }
    }
}

function get_template_desde_cache(template_name, relative_path=constants.flavor){
    const cache_key = `${relative_path}/${template_name}`;
    const in_cache = cache_key in _templates && typeof(_templates[cache_key]) === "function";
    if (!in_cache) return null;
    return _templates[cache_key];
}

function fetch_template(name, dir_=constants.flavor){
    /*
     * Devuelve un template para el flavor actual.
     */
    return new Promise((resolve, reject) => {
        const cached = get_template_desde_cache(name, dir_);
        if (cached !== null){
            resolve(cached);
            return;
        }
        fetch_template_request(dir_, name).then(
            (data) => {
                const template = Handlebars.compile(data);
                const cache_key = `${dir_}/${name}`;
                _templates[cache_key] = template; // agrega template a cache
                resolve(template);
            }
        ).catch(
            (error) => {
                reject(error);
            }
        )
    })
}

function fetch_template_request(dir_, name){
    return new Promise((resolve, reject) => {
        let full_dir;
        if(dir_ == undefined || dir_ === constants.flavor){
            full_dir = constants.PATH_TEMPLATES_FLAVORS + constants.flavor;
        } else {
            full_dir = constants.PATH_TEMPLATES_MODULOS + dir_;
        }
        const url = full_dir + "/" + name + ".html";    
        fetch(url).then(
            (response) => {
                /**
                 * Si la response se completó pero devuelve un 404, por ejemplo, se muestra el error.
                 * Asimismo se chequea por el status porque si el status es 0 podría ser debido a que se llamó a una url 
                 * que representa el filesystem (comienza en file:///) y estas no son errores.
                 */
                if (!response.ok && response.status !== 0){
                    const mensaje_error = `Error en fetch del template '${response.url}'. Razón: ${response.status} ${response.statusText}.`;
                    console.error(mensaje_error, response);
                    reject(mensaje_error);
                    return;
                }
                resolve(response.text());
            }
        ).catch(
            (error) => {
                console.error(error);
                reject(error);
            }
        )
    }) 
}

function load_js(path){
    return new Promise(function (resolve, reject) {
        const script = document.createElement('script');
        script.src = path;

        script.addEventListener('load', () => {
            // se carga el script
            resolve(true);
        });

        script.addEventListener('error', () => {
            const mensaje_error = `El js '${path}' no existe.`
            reject(mensaje_error);
        });

        document.head.appendChild(script);
    });
}

function ordenar_absolutamente(a, b){
    for(var i = 0; i < a.orden_absoluto.length; i++){
     var val_a = a.orden_absoluto[i];
     var val_b = b.orden_absoluto[i];
     if(val_a != val_b){
       if(typeof(val_b) == "undefined"){
         return 1;
       } else {
         return val_a - val_b;
       }
     }
  }
  return a.orden_absoluto.length < b.orden_absoluto.length? -1 : 1;
}

function ordenar_nombre(a, b) {
    var textA = a.nombre.toUpperCase();
    var textB = b.nombre.toUpperCase();
    return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
}


const asignar_evento = (dom_query, accion, tipo_evento='click') => Array.from(
    document.querySelectorAll(dom_query)
).map(
    elemento => elemento.addEventListener(tipo_evento, accion)
)

const asignar_evento_por_id = (elemento_id, accion, tipo_evento="click") => document.getElementById(
    elemento_id
).addEventListener(tipo_evento, accion)

/**
 * Función usada para reemplazar esta función de jquery:
 * $(elem).is(":visible").
 * Se toma de la documentación oficial de jquery:
 * https://github.com/jquery/jquery/blob/master/src/css/hiddenVisibleSelectors.js
 */
const is_visible = elem => {
    return Boolean( elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length );
}

const ready = callback => {
    if (document.readyState != "loading") callback();
    else document.addEventListener("DOMContentLoaded", callback);
}

/*** 
 * TOOLBAR HELPERS 
 * Aquí se incluyen las funciones que son comunes a todos los toolbars del módulo de voto.
 * La toolbar es la barra inferior con botones que se muestra en pantalla cuando se usa
 * el comando ```votar develop```.
 * Las mismas son usadas en los archivos llamados "devel.js" de algunos módulos, entre ellos,
 * escrutinio, menu y sufragio.
 * @todo separar esto en un modulo aparte.
 */

/**
 * Genera un objeto nuevo de toolbar y lo agrega al DOM.
 * @param {string} dom_string - Cadena de caracteres con la que crear el nuevo objeto toolbar en el DOM. Por default carga la toolbar tradicional.
 */
const cargar_toolbar_en_dom = (
    dom_string = "<div id='debug_toolbar' style='clear:both;background:#EEEEEE;border:solid 1px;'></div>"
) => {
    document.body.insertAdjacentHTML("beforeend", dom_string);
}

/**
 * Carga el boton en la toolbar con la data recibida.
 * La data contiene:
 * Id del boton que se agrega a la toolbar. Ejemplo: "debug_boleta_nueva".
 * Texto que se muestra en el botón. Ejemplo: "Boleta Nueva".
 * Función que se asignará al evento 'click'. Ejemplo, "boleta_nueva".
 * 
 * @param {object} data - Contiene las propiedades con las que se setea el botón del toolbar.
 */
const cargar_boton_en_toolbar = (data) =>
    document
        .getElementById("debug_toolbar")
        .appendChild(
            cargar_propiedades(
                cargar_estilos(document.createElement("div")),
                data
            )                
        );

/**
 * Agrega al elemento dado los estilos css.
 * 
 * @param {object} elemento - Objeto del dom al cual se le da los estilos. 
 * 
 * @returns {object} - Elemento del dom con los estilos ya definidos.
 */
const cargar_estilos = (elemento) => {
    elemento.style.float = "right";
    elemento.style.padding = "10px";
    elemento.style.border = 'solid 1px';
    elemento.style.margin = '0px 5px';
    elemento.style.background = '#EEEEEE';
    return elemento;
}

/**
 * Agrega las propiedades del elemento.
 * 
 * @param {object} elemento - Objeto del dom al cual se le dan las propiedades. 
 * 
 * @returns {object} - Elemento del dom con las propiedades ya cargadas.
 */
const cargar_propiedades = (elemento, { id, textContent, eventListener }) => {
    elemento.id = id;
    elemento.textContent = textContent;
    elemento.addEventListener(eventListener.event, eventListener.listener);
    return elemento;
};

/*** FIN TOOLBAR HELPERS */
