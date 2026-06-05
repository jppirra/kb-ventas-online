FROM maven:3.9.6-eclipse-temurin-21-alpine AS builder
WORKDIR /app
ENV MAVEN_OPTS="-Xmx512m -XX:MaxMetaspaceSize=256m"
COPY pom.xml .
RUN mvn dependency:go-offline -q
COPY src ./src
RUN mvn package -DskipTests -q && mv target/*.jar target/app.jar

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=builder /app/target/app.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
