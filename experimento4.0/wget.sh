#!/bin/bash
#descarga simulador de MSA de elecciones primarias de Neuquen 2023 para que quede funcional

URL="https://neuquen-2023.votar.com.ar/"
ARCHIVO="sufragio.html"

wget -c -p --recursive  --no-parent  --convert-links  --random-wait --wait 3 --no-http-keep-alive  --no-host-directories   --execute robots=off --user-agent=Mozilla/5.0  --level=inf  --accept '*'  --cut-dirs=0  $URL

wget -c -p --recursive  --no-parent  --convert-links  --random-wait --wait 3 --no-http-keep-alive  --no-host-directories   --execute robots=off --user-agent=Mozilla/5.0  --level=inf  --accept '*'  --cut-dirs=0  $URL$ARCHIVO

# como no bajó todo hace falta descargar archivos puntuales para que funcione

wget -c "${URL}ubicaciones.json"

bajar_archivo(){
	CARPETA=$1
	ARCHIVO="${CARPETA}/${2}"
	mkdir -p $CARPETA
	wget -c -O "${ARCHIVO}" "${URL}${ARCHIVO}" 
}

bajar_archivo "flavors/vanilla/sufragio" "templates.html"
bajar_archivo "partials" "encabezado.html"
bajar_archivo "flavors/vanilla/sufragio" "flavor.css"
bajar_archivo "templates" "sufragio.html" 
bajar_archivo "templates" "botones_ubicaciones.html"
bajar_archivo "js/sufragio/extension" "template-vanilla.js"
#imágenes
bajar_archivo "img"	"icono.png"
bajar_archivo "img"	"logo_eleccion_alto_contraste.png"
bajar_archivo "img"	"logo_eleccion.png"
bajar_archivo "img"	"logo_votar_blanco.png"
bajar_archivo "img"	"logo_votar.png"

bajar_archivo "img/sufragio"	"votar_lista_completa.png"
bajar_archivo "img/sufragio"	"votar_por_categoria.png"
bajar_archivo "img/sufragio"	"verificar_boleta.png"
bajar_archivo "img/sufragio"	"verificar_boleta1920.png"


#para un municipio solamente verificar en id de ubicación neuquen de ubicaciones.json

IDUBICACION="NE.1.22.69" #Neuquen
#IDUBICACION="NE.1.8" #Centenario

bajar_archivo "constants" "${IDUBICACION}.json"



bajar_archivo "datos/${IDUBICACION}" "Categorias.json"
bajar_archivo "datos/${IDUBICACION}" "Candidaturas.json"
bajar_archivo "datos/${IDUBICACION}" "Agrupaciones.json"
bajar_archivo "datos/${IDUBICACION}" "Boletas.json"



#faltarían imágenes de candidaturas estan en datos/IDUBICACION/Candidaturas.json coinside con "codigo": del candidato .webp
bajar_archivo "imagenes_candidaturas/neuquen_provinciales_2023" "BLC.svg"
#bajar_archivo "imagenes_candidaturas/neuquen_provinciales_2023" "842.6694.webp"

#candidatxs
for i in $(jq '.[] | .codigo' datos/${IDUBICACION}/Candidaturas.json | sed 's/"//g');
    do
        bajar_archivo "imagenes_candidaturas/neuquen_provinciales_2023" "${i}.webp";
    done;

#agrupaciones
for i in $(jq '.[] | .codigo' datos/${IDUBICACION}/Agrupaciones.json | sed 's/"//g');
    do
        bajar_archivo "imagenes_candidaturas/neuquen_provinciales_2023" "${i}.webp";
    done;












