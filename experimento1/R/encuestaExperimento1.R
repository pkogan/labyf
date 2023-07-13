pacman::p_load(tidyverse, googledrive, readxl)

datos<- read_xlsx("exportacionDatos.xlsx",
                  sheet=1, 
                  skip = 0)
summary(datos)
