# 1. Imagen Base: Usamos una versión ligera de Java (ej. Java 17)
# Esta es la "tierra" sobre la que construimos la casa.
FROM eclipse-temurin:17-jdk-alpine

# 2. Directorio de trabajo dentro del contenedor
WORKDIR /app

# 3. Copiamos el ejecutable de tu proyecto al contenedor
# Asume que ya ejecutaste 'mvn clean package' y se creó el .jar en /target
COPY target/*.jar app.jar

# 4. Exponemos el puerto (informativo, Spring Boot usa 8080 por defecto)
EXPOSE 8080

# 5. El comando para arrancar la app cuando inicie el contenedor
ENTRYPOINT ["java", "-jar", "app.jar"]