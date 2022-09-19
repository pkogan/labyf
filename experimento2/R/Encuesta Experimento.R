
#cargo paquetes
#instalar antes pacman

pacman::p_load(tidyverse, googledrive, readxl)


#Para bajarla del drive
#drive_download("https://docs.google.com/spreadsheets/d/18ngZ9EVLfF0n3fRAtxllCoK311AH9HrKOlGJu4-ee-Q/edit#gid=0",       
drive_download("https://docs.google.com/spreadsheets/d/18ngZ9EVLfF0n3fRAtxllCoK311AH9HrKOlGJu4-ee-Q/edit?usp=sharing",
               path="encuesta_experimento.xlsx", overwrite = TRUE)

datos<- read_xlsx("encuesta_experimento.xlsx",
                  sheet=1, 
                  skip = 8, 
                  col_names = c("unidad_academica",
                                "edad",
                                "claustro",
                                "1_facilidad_BP",
                                "1_facilidad_BU",
                                "1_facilidad_VE",
                                "2_secreto_BP",
                                "2_secreto_BU",
                                "2_secreto_VE",
                                "3_integridad_BP",
                                "3_integridad_BU",
                                "3_integridad_VE",
                                "4_auditabilidad_BP",
                                "4_auditabilidad_BU",
                                "4_auditabilidad_VE",
                                "5_recomienda_BP",
                                "5_recomienda_BU",
                                "5_recomienda_VE",
                                "hoja")) %>% 
                    select(-hoja) %>% 
                    mutate_at(vars(starts_with("5")), replace_na, 0)
  
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

