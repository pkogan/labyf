class TemplateFlavor extends Templates {

    /**
     * Devuelve el nombre del template para un candidato
     *
     * @param {*} candidato - El candidato a crearle el botón.
     * @param {*} candidatos - Candidatos que se muestran en la misma pantalla
     * @returns {String} Nombre del template que usa el candidato
     */
    __get_template_name_candidato(candidato, candidatos) {
        return (candidato.blanco) 
            ? "candidato_blanco"
            : ((this.__es_candidato_con_vicepresidente(candidato)))
            ? "candidato_y_vice"
            : "candidato_categoria";
    }

     /**
     * Crea el boton para una lista.
     *
     * @param {*} boleta - un objeto con la informacion de la lista para la que se quiere crear el item de lista.
     * @param {Boolean} normal - Si el id de candidatura está en la boleta o dentro de la lista de la boleta.
     * @returns {*}
     *  @override
     */
     crear_item_lista(boleta, normal, preagrupada) {
        let template_data = this.__get_template_data_lista(boleta, normal, preagrupada);
        let template_name = this.__get_template_name_lista(template_data);
        const template = get_template_desde_cache(template_name);
        var item = template(template_data);
        return item;
    }

    /**
     * Devuelve el nombre del template para las listas
     * @override
     */
    __get_template_name_lista(template_data) {
        const es_lista_completa =
            !template_data.normal 
            && !template_data.preagrupada;
        const es_adhesion = 
            template_data.normal 
            && template_data.preagrupada;
        if (es_lista_completa) return "seleccion_lista_completa";
        if (es_adhesion) return "seleccion_adhesion";
        return "seleccion_adhesion";
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
            if (categoria.consulta_popular) return "confirmacion_consulta_popular";

            const tiene_preferentes = es_candidato_con_preferentes(candidato);
            if (tiene_preferentes) return "confirmacion_con_preferentes";

            const candidato_gob_con_vice = es_candidato_gob_con_vice(categoria)
            if (candidato_gob_con_vice) return "confirmacion_gob_vice";
            if (constants.cargos_sin_suplentes.includes(categoria.codigo)){
                return "confirmacion_candidato_elegido";
            }else{
                return "confirmacion_candidato_elegido_suplentes";
            }

            return "confirmacion_candidato_elegido_suplentes";
        }
     
     
        function es_candidato_gob_con_vice(categoria){
            let gob_con_vice = constants.cargos_con_vicepresidente.includes(categoria.codigo);
            return gob_con_vice
        }
    }

    /*
    *
     * Devuelve los datos que necesita el template de lista
     *  @override
     */
    __get_template_data_lista(boleta, normal, preagrupada) {
        var id_lista = "lista_";
        if (normal) {
            id_lista += boleta.lista.id_candidatura;
        } else {
            id_lista += boleta.id_candidatura;
        }

        var seleccionado = "";
        if (this.__modo == "BTN_COMPLETA" && _categorias !== null) {
            if (_lista_seleccionada == boleta.lista.codigo) {
                seleccionado = "seleccionado";
            }
        }
        var tiene_vice_gob = false;
        var candidatos = get_candidatos_boleta(boleta);
        for (var i in candidatos) {
            if (candidatos[i].vice_gob ) {tiene_vice_gob = true; break;}
        }

        // Para Neuquén, no se muestran los candidatos del cargo Consejero escolar en las tarjetas.
        // Solo en Verificación.
        candidatos = candidatos.filter((candidato) => {
            if (!candidato) return false;
            return ![
                "C01",
                "C02",
                "C03",
                "C04",
                "C05",
                "C06",
                "C07",
                "C08",
                "C09",
                "C10",
                "C11",
                "C12",
                "C13",
                "C14",
            ].includes(candidato.cod_categoria);
        });

        if (this.__modo == "BTN_COMPLETA") {
            candidatos = candidatos.map((candidato) => {
                let c = candidato;
                if (candidato.categoria.codigo == "GOB") {
                    c = {
                        ...candidato,
                        categoria: {
                            ...candidato.categoria,
                            nombre: "Gobernador/a"
                        }
                    };
                }
                return c;
            });
        }

        let template_data = this.__main_dict_base(id_lista);
        template_data.lista = normal ? boleta.lista : boleta;
        template_data.normal = normal;
        template_data.seleccionado = seleccionado;
        template_data.candidatos = candidatos;
        template_data.cantidad_candidatos = candidatos.length;
        template_data.clase_solo_2_candidatos = candidatos.length == 2 ? true : false;
        template_data.tiene_vice_gob = tiene_vice_gob
        template_data.preagrupada = preagrupada;
        template_data.agrupacion_municipal = normal && boleta.agrupacion_municipal;
        return template_data;
    }


    /**
     * Crea el contenido del boton de verificacion.
     *
     * @param {*} candidato - El candidato a crearle el botón.
     * @param {*} template - Template de verificacion (Handlebars).
     * @returns {String} Html en formato de cadena de caracteres.
     */
    __crear_item_verificacion(candidato, categoria, template) {
        var self = this;
        //el template de verificacion usa un partial que debemos registrar previo a devolverlo
        Handlebars.registerPartial(
            "componenteVerificacion",
            get_template_desde_cache(template_name_componente_verificacion(candidato, categoria))
        );
        return super.__crear_item_verificacion(candidato, categoria, template);


        function template_name_componente_verificacion(candidato, categoria) {   
            return (self.__cargo_muestra_vice_en_verificacion(categoria.codigo))
                ? "candidato_verificacion_con_vice"
                : "candidato_verificacion_categoria";
        }
    }

    /**
     * Genera un diccionario de candidatos.
     *
     * @param {*} candidato - Candidato del que queremos mostrar los "subcandidatos".
     * @param {*} id_boton - Identificador del botón.
     * @param {*} vista Lugar donde se van a mostrar tales candidatos. Pueden ser: "barra_lateral", "boton_candidato", "confirmacion", "verificacion".
     * @returns {Object} Datos del candidato.
     */
    main_dict_candidato(candidato, id_boton, vista) {
        var data = this.__main_dict_base(id_boton);
        data.candidato = candidato;
        data.blanco = candidato.clase == "Blanco";

        let candidatos_confirmacion = [];
        if (typeof (candidato.secundarios) !== "undefined") {
            if (this.__es_candidato_con_secundarios(candidato) ||
                (!candidato.cargo_ejecutivo && candidato.codigo !== "BLC")
            ) {
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

        // si no es un cargo ejecutivo, inserto el 1er candidato adelante
        // de todo, excepto BLC
        if (!candidato.cargo_ejecutivo && candidato.codigo !== "BLC") {
            let candidato_principal = {
                nombre: candidato.nombre,
                nro_orden: candidato.nro_orden,
                id_candidatura: candidato.id_candidatura
            };

            if (typeof (candidato.imagenes) !== "undefined")
                candidato_principal.imagen = candidato.imagenes[0];

            data.candidatos_confirmacion = candidatos_confirmacion;
        }
        return data;
    }

    /**
     * Indica si es cargo con secundarios
     * 
     * @param {number} cod_categoria - Codigo de la categoria sobre la que se quiere consultar
     * @returns {Boolean}
     */
    __es_cargo_con_secundarios(cod_categoria) {
        if(!("cargos_con_secundarios" in constants))
            return false;
        return constants.cargos_con_secundarios.includes(cod_categoria);
    }

    /**
     * Indica si el cargo del candidato es con secundarios
     * 
     * @param {*} candidato - El candidato sobre el que se consulta si tiene cargo con secundarios
     * @returns {Boolean}
     */
    __es_candidato_con_secundarios(candidato) {
        return this.__es_cargo_con_secundarios(candidato.cod_categoria);
    }

     /**
     * Indica si el cargo del candidato es con vicepresidente
     * 
     * @param {*} candidato - El candidato sobre el que se consulta si tiene cargo con vicepresidente
     * @returns {Boolean}
     */
     __es_candidato_con_vicepresidente(candidato){
        if(!("cargos_con_vicepresidente" in constants))
            return false;
        return constants.cargos_con_vicepresidente
                        .includes(candidato.cod_categoria);
    }

    /**
     * Indica si es cargo con secundarios
     * 
     * @param {number} cod_categoria - Codigo de la categoria sobre la que se quiere consultar
     * @returns {Boolean}
     */
    __cargo_muestra_vice_en_verificacion(cod_categoria) {
        if(!("cargos_verificacion_con_vice_imagen" in constants))
            return false;
        return constants.cargos_verificacion_con_vice_imagen.includes(cod_categoria);
    }
}

templateClass = new TemplateFlavor(get_modo(), constants);