FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

# Copiamos todo el contenido de la carpeta 'back' al contenedor
COPY . .

# Verificamos si los archivos llegaron (esto saldrá en el log si falla)
RUN ls -l /app

# Intentamos compilar
RUN mvn clean package -DskipTests

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]