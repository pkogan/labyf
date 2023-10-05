class TemplateFlavor extends Templates {

    /**
     * Crea el boton para una lista.
     *
     * @param {*} boleta - un objeto con la informacion de la lista para la que se quiere crear el item de lista.
     * @param {Boolean} normal - Si el id de candidatura está en la boleta o dentro de la lista de la boleta.
     * @returns {String} Html en formato de cadena de caracteres.
     */
        crear_item_lista(boleta, normal) {
            let template_name = this.__get_template_name_lista();
            let template_data = this.__get_template_data_lista(boleta, normal);
            const template = get_template_desde_cache(template_name);
            var item = template(template_data);
            return item;
        }

}

templateClass = new TemplateFlavor(get_modo(), constants);