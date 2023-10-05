class TemplateFlavor extends Templates {
    __get_template_data_partido(partido, seleccionado, categoria_actual) {
        var extra_classes = "";

        var id_lista = "partido_" + partido.codigo;
        var path_imagen_agrupacion = get_path_partido(partido.imagen);
        var img_cand = [];
        var candidatos = []

        if (constants.mostrar_fotos_candididatos_boton_partido) {
            var filtro = {cod_partido: partido.codigo,cod_categoria: ["JEF"]};
            if (this.__modo == "BTN_CATEG") {
                filtro.cod_categoria = categoria_actual.codigo;
            }
            var candidaturas = local_data.candidaturas.many(filtro);

            for (var i in candidaturas) {
                var candidato = candidaturas[i];
                img_cand.push(candidato.codigo);
                candidatos.push(candidato)
            }
        }

        if (seleccionado) {
            extra_classes += " seleccionado";
        }

        var template_data = {
            id_boton: id_lista,
            partido: partido,
            path_imagen_agrupacion: path_imagen_agrupacion,
            imagenes_candidatos: img_cand,
            candidato: candidatos,
            extra_classes: extra_classes,
        };
        return template_data;
    }
}

templateClass = new TemplateFlavor(get_modo(), constants);