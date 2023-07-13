class TemplateFlavor extends Templates {

    main_dict_candidato(candidato, id_boton, vista) {
        var data = this.__main_dict_base(id_boton);
        data.candidato = candidato;
        data.blanco = candidato.clase == "Blanco";

        let candidatos_confirmacion = [];
        if (typeof (candidato.secundarios) !== "undefined") {
            if (candidato.codigo !== "BLC") {
                var filter = {
                    clase: "Candidato",
                    cod_lista: candidato.cod_lista,
                    cod_categoria: candidato.cod_categoria,
                };
                candidatos_confirmacion = local_data.candidaturas.many(filter);
                data.secundarios = this.__construir_candidatos(candidato, "secundarios", vista);
            }
        }

        if (typeof (candidato.suplentes) !== "undefined") {
            data.suplentes = this.__construir_candidatos(candidato, "suplentes", vista);
        }

        return data;
    }

    /**
     * Indica si es cargo con suplentes
     *
     * @param {number} cod_categoria - Codigo de la categoria sobre la que se quiere consultar
     * @returns {Boolean}
     */
    __es_cargo_con_secundarios(cod_categoria) {
        if (!("cargos_con_secundarios" in constants))
            return false;
        return constants.cargos_con_secundarios.includes(cod_categoria);
    }

    /**
     * Indica si el cargo del candidato es con suplentes
     *
     * @param {*} candidato - El candidato sobre el que se consulta si tiene cargo con suplentes
     * @returns {Boolean}
     */
    __es_candidato_con_secundarios(candidato) {
        return this.__es_cargo_con_secundarios(candidato.cod_categoria);
    }

    /**
     * Indica si es cargo con suplentes
     *
     * @param {number} cod_categoria - Codigo de la categoria sobre la que se quiere consultar
     * @returns {Boolean}
     */
    __es_cargo_con_suplentes(cod_categoria) {
        if (!("cargos_con_suplentes" in constants))
            return false;
        return constants.cargos_con_suplentes.includes(cod_categoria);
    }

    /**
     * Indica si el cargo del candidato es con suplentes
     *
     * @param {*} candidato - El candidato sobre el que se consulta si tiene cargo con suplentes
     * @returns {Boolean}
     */
    __es_candidato_con_suplentes(candidato) {
        return this.__es_cargo_con_suplentes(candidato.cod_categoria);
    }

    __get_template_name_candidato(candidato, candidatos) {
        if (candidato.blanco)
            return "candidato_blanco"

        if (this.__es_candidato_con_secundarios(candidato) &&
            this.__es_candidato_con_suplentes(candidato)) {
            return "candidato_categoria_con_secundarios_y_suplentes"
        } else if (this.__es_candidato_con_secundarios(candidato)) {
            return "candidato_categoria_con_secundarios"
        } else if (this.__es_candidato_con_suplentes(candidato)) {
            return "candidato_categoria_con_suplentes"
        } else {
            return "candidato_categoria"
        }
    }

    /**
     * Devuelve los datos que necesita el template de la tarjeta de confirmacion
     *
     * @param {*} candidato - datos del candidato a crearle el panel de verificación.
     * @param {*} categoria - La categoria a crearle el botón.
     * @returns {*}
     */
    __get_template_data_verificacion(candidato, categoria) {
        var id_boton = "categoria_" + candidato.cod_categoria;
        var template_data = this.main_dict_candidato(
            candidato,
            id_boton,
            "verificacion"
        );
        template_data.es_consulta = (categoria.consulta_popular
            && !data_template.blanco);
        template_data.categoria = categoria;
        template_data.cant_cargos = local_data.categorias.many().length;
        template_data.muestra_suplentes = !this.__es_candidato_con_secundarios(candidato)
            && this.__es_candidato_con_suplentes(candidato)
        return template_data;
    }

    /**
     * Devuelve el nombre del template de la tarjeta de confirmacion
     *
     * @param {*} candidato - El candidato a crearle el botón.
     * @param {*} categoria - La categoria a crearle el botón.
     * @returns {String} Nombre del template que se usa en la confirmacion
     */
    __get_template_name_confirmacion(candidato, categoria) {
        //registra partial que usa el template de confirmacion confirmacion_tarjeta
        Handlebars.registerPartial(
            "componenteConfirmacion",
            get_template_desde_cache(
                template_name_componente_confirmacion(candidato, categoria)
            )
        );
        return "confirmacion_tarjeta";


        function template_name_componente_confirmacion(candidato, categoria) {
            if (candidato.blanco || candidato.clase === "Blanco")
                return "confirmacion_candidato_blanco";

            if (candidato.cod_categoria === "GOB" || candidato.cod_categoria === "INT") {
                return "confirmacion_candidato_elegido_sin_cargo_ejecutivo";
            } else if (candidato.cod_categoria === "LDE") {
                return "confirmacion_candidato_elegido_con_suplentes";
            } else if (candidato.cod_categoria === "LDU") {
                return "confirmacion_candidato_elegido_legislador";
            } else if (candidato.cod_categoria === "TCP" || candidato.cod_categoria === "TCM") {
                return "confirmacion_candidato_elegido_con_secundarios_y_suplentes";
            } else {
                return "confirmacion_candidato_elegido";
            }
        }
    }

}

templateClass = new TemplateFlavor(get_modo(), constants);