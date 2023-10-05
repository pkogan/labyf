#!/bin/bash
#descarga simulador de MSA de elecciones primarias de Neuquen 2023 para que quede funcional

URL="http://plazahuincul.votar.com.ar/"
ARCHIVO="sufragio.html"

wget -c  --recursive  --no-parent  --convert-links  --random-wait --wait 1 --no-http-keep-alive  --no-host-directories   --execute robots=off --user-agent=Mozilla/5.0  --level=inf  --accept '*'  --cut-dirs=0  $URL

wget -c  --recursive  --no-parent   --random-wait --wait 1 --no-http-keep-alive  --no-host-directories   --execute robots=off --user-agent=Mozilla/5.0  --level=inf  --accept '*'  --cut-dirs=0  $URL$ARCHIVO

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

#IDUBICACION="NE.1.22.69" #Neuquen previo a sacar lista 74
#IDUBICACION="SA.1.1" #Salta
#IDUBICACION="NE.1.8" #Centenario

#IDUBICACION="CO.12.470" #Carlos Paz
#IDUBICACION="CC" #Cutral-Co
IDUBICACION="PH" #Cutral-Co
bajar_archivo "constants" "${IDUBICACION}.json"



bajar_archivo "datos/${IDUBICACION}" "Categorias.json"
bajar_archivo "datos/${IDUBICACION}" "Candidaturas.json"
bajar_archivo "datos/${IDUBICACION}" "Agrupaciones.json"
bajar_archivo "datos/${IDUBICACION}" "Boletas.json"

#CARPETAIMAGENES="cutralco_municipales_2023"
CARPETAIMAGENES="plaza_huincul_municipales_2023"

#faltarían imágenes de candidaturas estan en datos/IDUBICACION/Candidaturas.json coinside con "codigo": del candidato .webp
bajar_archivo "imagenes_candidaturas/${CARPETAIMAGENES}" "BLC.svg"


#candidatxs
#for i in $(jq '.[] | .codigo' datos/${IDUBICACION}/Candidaturas.json | sed 's/"//g');
for i in $(jq  '.[].imagenes | unique[]' datos/${IDUBICACION}/Candidaturas.json | sed 's/"//g');
    do
        bajar_archivo "imagenes_candidaturas/${CARPETAIMAGENES}" "${i}.webp";
    done;

#agrupaciones
for i in $(jq '.[] | .codigo' datos/${IDUBICACION}/Agrupaciones.json | sed 's/"//g');
    do
        bajar_archivo "imagenes_candidaturas/${CARPETAIMAGENES}" "${i}.webp";
    done;













