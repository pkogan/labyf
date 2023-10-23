class TemplateFlavor extends Templates {

        /**
     * Devuelve el nombre del template para un candidato
     *
     * @param {*} candidato - El candidato a crearle el botón.
     * @param {*} candidatos - Candidatos que se muestran en la misma pantalla
     * @returns {String} Nombre del template que usa el candidato
     */
        __get_template_name_candidato(candidato, candidatos) {
            return "candidato_categoria";
        }

}

templateClass = new TemplateFlavor(get_modo(), constants);