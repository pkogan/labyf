#Cargar librería
library(dplyr)
library(skimr)
library(data.table)

data_mesa1 <- read.csv("padron600.csv", sep=",",header = FALSE)
colnames(data_mesa1) <- paste("P" , (1:27) , sep="-")
row.names(data_mesa1) <- paste("L" , (1:27) , sep="-")

data_mesa1t<-transpose(data_mesa1)
colnames(data_mesa1t) <- row.names(data_mesa1)
row.names(data_mesa1t) <- colnames(data_mesa1)
#Crear mapa de calor
heatmap(as.matrix(data_mesa1t[, -1]))
summary(data_mesa1t)

skim(data_mesa1t)
boxplot(data_mesa1t)
