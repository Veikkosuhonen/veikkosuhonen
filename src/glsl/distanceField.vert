varying vec3 vPosition;

void main(){
    vec4 worldPosition = (modelMatrix * vec4(position, 1.0));
    vPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
}