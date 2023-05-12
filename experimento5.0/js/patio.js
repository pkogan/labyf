/*
 *
 * Patio.js.
 * A Javascript library for handling your application playground.
 *
 */

function Patio(container, tiles, context_tiles, template_dir, flavor_dir=constants.flavor){
    /* The main patio container.
     * Arguments:
     * container -- a query string for the container.
     * tiles -- the tiles for your patio.
     * context_tiles -- the context tiles for your tiles
     * the directory where you have your templates
     */

    this.container = container;
    this.template_dir = template_dir;
    this.tiles = [];

    this.hide_tiles = function(except){
        /* Hide all the tiles!
         * Arguments:
         * except -- all the tiles but this.
         */
        tiles.filter(
            (tile) => tile.id !== except
        ).map(
            (tile) => this[tile.id].hide()
        );                   
    };

    this.hide_context_tiles = function(){
        /* Hide all the context tiles! */
        context_tiles.map((ct) => this[ct.id].hide());                         
    };

    this.add_tile = function(tile, is_context_tile=false){
        /* Adds the tile to the Patio. 
         * Arguments:
         * tile -- the tile you want to add.
         * is_context_tile -- a boolean stating it it's a context tile or not.
         */
        if(is_context_tile){
            tile.patio = this;
        } else {
            tile.parent = this;
        }

        const tile_obj = new Tile(tile);
        this[tile.id] = tile_obj;
        this.tiles.push(tile_obj);
    };

    /**
     * @function
     * @description Carga todos los templates de disco y los renderiza.
     * Esto lo hace llamando al método ``load`` de cada clase ``Tile``.
     * Es importante que se carguen primero las tiles y luego las context tiles
     * ya que hay context tiles que en el dom se ubican dentro de una tile. 
     * @returns {Promise} - Promise que se resuelve una vez que todos los templates fueron renderizados. 
     */
    this.load = () => {
        return new Promise((resolve, reject) => {
            const tiles_actuales = this.tiles.filter(
                (tile) => !context_tiles.map(ct => ct.id).includes(tile._id)
            )
            const context_tiles_actuales = this.tiles.filter(
                (tile) => context_tiles.map(ct => ct.id).includes(tile._id)
            )            
            const tiles_promises = tiles_actuales.map((tile) => tile.load());
            Promise.all(tiles_promises).then(() => {
                const context_tiles_promises = context_tiles_actuales.map((tile) => tile.load());
                Promise.all(context_tiles_promises).then(() => resolve());
            }).catch((error) => {
                console.error("Error en patio: no se pudieron cargar los templates.", error)
                reject(error);
            })
        });
    }
    
    // Adding all the tiles as object attributes
    tiles.map((tile) => this.add_tile(tile));

    // Adding all the context tiles as object attributes
    context_tiles.map((tile) => this.add_tile(tile, true));                       

}

function Tile(dict){
    /* A tile object. 
     * Arguments:
     * dict -- a dictionary with the tile configs and callbacks. The default
     * values accepted by this script are:
     *   id: A string with the id of the object.
     *   context_tiles: a list with the ids of the context tiles for this tile.
     *   template: A string with the name of the template to render in the tile.
     *   template_data_callback: a callback to populate the data template. It's
     *      called after loading the template but before putting the content in
     *      the container
     *   button_filter: a string with the filter for identifying the buttons in
     *      a patio.
     *   callback_click: a callback function handling the click for all the
     *      buttons matching the 'button_filter'
     *   callback_before: same as the click but before it.
     *   callback_after: same as the click but after it.
     *   callback_show: a function called before showing.
     *   callback_hide a function called after hiding.
     *   insert_before: a boolean stating if the tile HTML should be inserted
     *   before the rest of the HTML intead of after
     *
     *   container: ONLY FOR CONTEXT TILES. The identifier for the container
     *      where the context tile will be added.
     *
     *  If you like you can add your own values for your own methods.
     */

    // I copy the dictionary properties to this object
    for(var key in dict){
        var value = dict[key];
        if(dict.hasOwnProperty(key)){
            this[key] = dict[key]
        }
    }
    // The id will have the hash as a shortcut.
    this.id = "#" + dict.id;
    // We will save the original ID because it's usefull to have it.
    this._id = dict.id;

    this.show = function(){
        /* Shows this tiles and it's context_tiles */
        if(typeof(this.callback_show) === "function"){
            this.callback_show();
        }
        // Shows the object.
        const to_show = document.querySelector(this.id)
        if(!to_show) {
            console.warn(`En patio: no se puede mostrar el elemento ${this.id}. Razón: no se encuentra en el dom.`);
            return;
        }
        to_show.style.display = "";
        // if it's not a context tile will show its context tiles.
        if(typeof(this.parent) != "undefined"){
            this.parent.last_shown = this._id;
            // hide all the context tiles
            this.parent.hide_context_tiles();
            // and show the context tiles for this tile.
            if (this.context_tiles){
                this.context_tiles.forEach(
                    (ct) => this.parent[ct].show() // recursividad (llama a este mismo metodo desde otros tiles)
                );
            }
        }
    };

    this.hide = function(){
        /* hides this tile. calls for the after hide callback if present. */
        const to_hide = document.querySelector(this.id)
        if (!to_hide){
            console.warn(`En patio: no se puede ocultar el elemento ${this.id}. Razón: no se encuentra en el dom.`);
            return;
        }
        to_hide.style.display = "none";  
        if(typeof(this.callback_hide) === "function"){
            this.callback_hide();
        }
    };

    this.load = function(){
        return this.load_promise();
    }

    this.load_promise = function(){
        return new Promise((resolve, reject) => {
            this.render_template().then((template_html) => {
                this.load_template(template_html);
                resolve();
            }).catch((error) => {
                reject(error);
            })
        });
    };

    /** Loads a tile render it, append it and adds the callbacks. */
    this.load_template = function(template_html){
        // decides if the html should be appended or prepended
        const is_insert_before = typeof(this.insert_before) != "undefined" && this.insert_before
        const where_to_insert = (is_insert_before)? "afterbegin" : "beforeend";

        // find out the container in which we should add the html and add it
        if(typeof(this.container) != "undefined"){
            const contenedor = document.querySelector(this.container);
            if (!contenedor){
                console.warn(`En patio: no se encontró el contenedor ${this.container} cargado en el dom.`);
            } else {
                contenedor.insertAdjacentHTML(where_to_insert, template_html);
            }
        } else if(typeof(this.parent) != "undefined"){
            this.parent.container.insertAdjacentHTML(where_to_insert, template_html);
        }

        /**
         * @todo: analizar si vale la pena mantener este objeto en memoria,
         * por el uso que se le da parece ser innecesario.
         */
        this.dom_element = document.querySelector(this.id)

        // the 3 click callbacks, all of them are for the same element, they
        // are launched in that order bacause they ar added in that order,
        // maybe some day this should be a list. 
        if(typeof(this.callback_before) === "function"){
            this.add_click_event("callback_before");
        }

        if(typeof(this.callback_click) === "function"){
            this.add_click_event("callback_click");
        }

        if(typeof(this.callback_after) === "function"){
            this.add_click_event("callback_after");
        }
    }; 

    this.render_template = function(){
        return new Promise((resolve, reject) => {
            /* Renders the template. */
            // if the template is inexistent we want to add an empty div by
            // default.
            if(typeof(this.template) == "undefined"){
                const html = `<div id="${this._id}" style="display:none"></div>`; 
                resolve(html);
                return;
            }
            let template_dir = "";
            // We decide which template we will take depending the type of tile.
            if(typeof(this.parent) != "undefined"){
                template_dir = this.parent.template_dir;
            } else {
                template_dir = `${this.patio.template_dir}/context`;
            }
            // we render it 
            fetch_template(this.template, template_dir).then((fetched_template) => {
                let template_data = {};
                // and populate it in case it has a population callback.
                if(typeof(this.template_data_callback) === "function"){
                    template_data = this.template_data_callback(this.id);
                } 
                const html = fetched_template(template_data);
                resolve(html);
            }).catch((error) => {
                //hacemos un intento mas de buscarlo en el flavor
                fetch_template(this.template).then((fetched_template) => {
                    let template_data = {};
                    // and populate it in case it has a population callback.
                    if(typeof(this.template_data_callback) === "function"){
                        template_data = this.template_data_callback(this.id);
                    }
                    const html = fetched_template(template_data);
                    resolve(html);
                }).catch((error) => {
                    console.error(error);
                    reject(error);
                })
            })
        });
    };
    
    this.add_click_event = function(callback_name){
        /* Adds the click event for the buttons with the filter*/
        /**@todo hacer que le pase la función directamente, y no su nombre. */
        const action = this[callback_name];
        this.on_click = (event) => action(event.currentTarget);
        document
            .querySelectorAll(this.button_filter)
            .forEach((btn) =>
                btn.addEventListener("click", this.on_click)
            ); 
    };

    this.remove_click_event = function(){
        /* removes the click event for the buttons with the filter*/
        document
            .querySelectorAll(this.button_filter)
            .forEach((btn) =>
                btn.removeEventListener("click", this.on_click)
            ); 
    };

    this.on_click = function(event){
        // funcion abstracta, la implementa this.add_click_event
        // esto se hace para que se pueda desbindear el evento
        // Para mas detalle, ver documentacion de removeEventListener
    }

    this.only = function(){
        /* Hide all the tiles but this. */
        this.parent.hide_tiles(this._id); 
        this.show();
    };

    this.html = function(html){
        /* A shortcut  */
        this.dom_element.innerHTML = html;
    };

    this.addClass = function(...args){
        /* A shortcut for classList.add */
        this.dom_element.classList.add(...args);
    };

    this.removeClass = function(_class){
        /* A shortcut for classList.remove */
        this.dom_element.classList.remove(_class);
    };
}
