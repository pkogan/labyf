
#cargo paquetes
#instalar antes pacman

pacman::p_load(tidyverse,  skimr, readxl)

download.file(ur= "https://incuba.fi.uncoma.edu.ar/labyf/experimento2/R/encuesta_experimento.xlsx",
              destfile="encuesta_experimento.xlsx")
datos<- read_xlsx("encuesta_experimento.xlsx",
                  sheet=1, 
                  skip = 7, 
                  col_names = c("unidad_academica",
                                "edad",
                                "claustro",
                                "1_facilidad_BP",
                                "1_facilidad_BUP",
                                "1_facilidad_VE",
                                "2_secreto_BP",
                                "2_secreto_BUP",
                                "2_secreto_VE",
                                "3_integridad_BP",
                                "3_integridad_BUP",
                                "3_integridad_VE",
                                "4_auditabilidad_BP",
                                "4_auditabilidad_BUP",
                                "4_auditabilidad_VE",
                                "5_recomienda_BP",
                                "5_recomienda_BUP",
                                "5_recomienda_VE",
                                "hoja")) %>% 
                    select(-hoja) %>% 
                    mutate_at(vars(starts_with("5")), replace_na, 0)
  summary(datos)
  
  borrar <- c("unidad_academica","claustro","edad")
  datos2 <- datos[ , !(names(datos) %in% borrar)]
  summary(datos2)
  
  skim(datos2)
  skim(datos)
  boxplot(datos2)
  ggplot(datos2,aes( y=value)) +
    geom_boxplot(position='dodge', stat='identity') +
    ggtitle('Facilidad de Uso') +
    xlab('Tipo de sistema') +
    ylab('Valor') +
    labs(fill='Edades')
  
  
#recodificación edad  
 datos= datos %>% 
          mutate (edadr=as.factor(case_when(edad < 25~"Menor de 25",
                                  edad >= 25 & edad <= 34 ~ "Entre 25 y 34",
                                  edad >= 35 & edad <= 44 ~ "Entre 35 y 44", 
                                  edad >=45 ~ "De 45 a más"))) %>% 
          mutate(edadr =fct_relevel(edadr, 
                                c("Menor de 25",
                                            "Entre 25 y 34" , 
                                            "Entre 35 y 44" ,
                                             "De 45 a más"))) %>% 
          select(-edad)
          
 

 a= datos %>% group_by(edadr) %>% 
           summarise_if(is.numeric,mean) %>% 
          pivot_longer(cols= is.numeric,names_to="variable")

barplot(height=a$value,names=a$variable)


df=a %>% filter(variable %in% c("1_facilidad_BP",
                                "1_facilidad_BU",
                                "1_facilidad_BE"))

#Facilidad de Uso
df=a %>% filter(grepl("1",variable, fixed = TRUE))
ggplot(df, aes(fill=edadr, y=value, x=variable)) +
  geom_bar(position='dodge', stat='identity') +
  ggtitle('Facilidad de Uso') +
  xlab('Tipo de sistema') +
  ylab('Valor') +
  labs(fill='Edades')

titulo="Secreto del voto"
df=a %>% filter(grepl("2",variable, fixed = TRUE))
ggplot(df, aes(fill=edadr, y=value, x=variable)) +
  geom_bar(position='dodge', stat='identity') +
  ggtitle(titulo) +
  xlab('Tipo de sistema') +
  ylab('Valor') +
  labs(fill='Edades')

titulo="Integridad"
df=a %>% filter(grepl("3",variable, fixed = TRUE))
ggplot(df, aes(fill=edadr, y=value, x=variable)) +
  geom_bar(position='dodge', stat='identity') +
  ggtitle(titulo) +
  xlab('Tipo de sistema') +
  ylab('Valor') +
  labs(fill='Edades')

titulo="Observabilidad"
df=a %>% filter(grepl("4",variable, fixed = TRUE))
ggplot(df, aes(fill=edadr, y=value, x=variable)) +
  geom_bar(position='dodge', stat='identity') +
  ggtitle(titulo) +
  xlab('Tipo de sistema') +
  ylab('Valor') +
  labs(fill='Edades')

titulo="Preferencia"
df=a %>% filter(grepl("5",variable, fixed = TRUE))
ggplot(df, aes(fill=edadr, y=value, x=variable)) +
  geom_bar(position='dodge', stat='identity') +
  ggtitle(titulo) +
  xlab('Tipo de sistema') +
  ylab('Valor') +
  labs(fill='Edades')

#Caso menores de 25 prefieren el voto electrónico
titulo="Menores de 25"
df=a %>% filter(edadr=="Menor de 25")
ggplot(df, aes(fill=value, y=variable, x=value)) +
  geom_bar(position='dodge', stat='identity') +
  ggtitle(titulo) +
  xlab('Tipo de sistema') +
  ylab('Variable por Sistema') +
  labs(fill='Valores')

a2= datos %>% summarise_if(is.numeric,mean) %>% 
  pivot_longer(cols= is.numeric,names_to="variable")


#Caso Global Preferencia BU

titulo="Global"
df=a2 #%>% filter(edadr=="Menor de 25")
ggplot(df, aes(fill=value, y=variable, x=value)) +
  geom_bar(position='dodge', stat='identity') +
  ggtitle(titulo) +
  xlab('Tipo de sistema') +
  ylab('Variable por Sistema') +
  labs(fill='Valores')



titulo="Preferencia Global"
df=a2 %>% filter(grepl("5",variable, fixed = TRUE))
ggplot(df, aes(fill=value, y=variable, x=value)) +
  geom_bar(position='dodge', stat='identity') +
  ggtitle(titulo) +
  xlab('Tipo de sistema') +
  ylab('Valor') +
  labs(fill='Valor')



#Preferencia por claustro
a= datos %>% group_by(claustro) %>% 
  summarise_if(is.numeric,mean) %>% 
  pivot_longer(cols= is.numeric,names_to="variable")

titulo="Preferencia"
df=a %>% filter(grepl("5",variable, fixed = TRUE))
ggplot(df, aes(fill=claustro, y=value, x=variable)) +
  geom_bar(position='dodge', stat='identity') +
  ggtitle(titulo) +
  xlab('Tipo de sistema') +
  ylab('Valor') +
  labs(fill='Claustro')


#Preferencia por UA
a= datos %>% group_by(unidad_academica) %>% 
  summarise_if(is.numeric,mean) %>% 
  pivot_longer(cols= is.numeric,names_to="variable")

titulo="Preferencia"
df=a %>% filter(grepl("5",variable, fixed = TRUE))
ggplot(df, aes(fill=variable, y=unidad_academica, x=value)) +
  geom_bar(position='dodge', stat='identity') +
  ggtitle(titulo) +
  xlab('Valor') +
  ylab('Unidad Académica') +
  labs(fill='Tipo de sistema')

pacman::p_load(fmsb)

library(fmsb)

# Create data: note in High school for several students
set.seed(99)
data <- as.data.frame(matrix( sample( 0:20 , 15 , replace=F) , ncol=5))

BUP=a2 %>% filter(grepl("BUP",variable, fixed = TRUE))
VE=a2 %>% filter(grepl("VE",variable, fixed = TRUE))
BP=a2 %>% filter(grepl("BP",variable, fixed = TRUE))
BP['value']
data3<-data.frame(
  A=BP['value'],
  B=BUP['value'],
  C=VE['value']
)

rownames(data3)<-c("Facilidad de uso","Secreto del voto","Integridad del voto","Auditabilidad","preferencia")
colnames(data3)<-c("BP","BUP","VE")
colnames(data) <- c("math" , "english" , "biology" , "music" , "R-coding" )
rownames(data) <- paste("mister" , letters[1:3] , sep="-")
data
pacman::p_load(data.table)
library(data.table)
data3t<-transpose(data3)
rownames(data3t) <- colnames(data3)
colnames(data3t) <- rownames(data3)
data3t<-select(data3t,-preferencia)
data3t<-rbind(rep(5,5) , rep(3,5) , data3t)
data3t
# To use the fmsb package, I have to add 2 lines to the dataframe: the max and min of each variable to show on the plot!


# Color vector

#rgb(0.486,0.682,0,1) verdeclaro
#rgb(0.78, 0.482, 1,1) violeta claro
# 0.463, 0.431, 0.976
# 0.431, 0.976, 0.463
#rgb(0, 0.749, 0.769	,1)turquesa
colors_border=c( rgb(0.976, 0.463, 0.431	,1) , rgb(0.463, 0.431, 0.976,1) , rgb(0.431, 0.976, 0.463,1))
colors_in=c(rgb(0.976, 0.463, 0.431	,0.3) , rgb(0.463, 0.431, 0.976,0.3) , rgb(0.431, 0.976, 0.463,0.3))

# Set graphic colors
#library(RColorBrewer)
#coul <- brewer.pal(3, "BuPu")
#colors_border <- coul
#library(scales)
#colors_in <- alpha(coul,0.3)

radarchart(data3t)

# If you remove the 2 first lines, the function compute the max and min of each variable with the available data:
radarchart( data3t  , axistype=1 , 
            #custom polygon
            pcol=colors_border  , 
            #pfcol=colors_in,
            plwd=5 , plty=1,
            #custom the grid
            #cglcol="grey", 
            #cglty=1,
            axislabcol="grey", 
            caxislabels=seq(3,5,0.5),
            cglwd=1,
            #custom labels
            vlcex=1 
)


# Add a legend
legend(x=1.5, y=1, legend = rownames(data3t[-c(1,2),]), bty = "n", pch=20 , col=colors_border , text.col = "black", cex=1.2, pt.cex=3)
