import * as THREE from 'three';
import { Face } from './ConvexHull.js'; // TODO after r145 import from three

/**
 * Doubly Connected Edge List - DCEL
 * For each face in the geometry, contains its half-edges.
 * A half-edge has two vertices and its twin half-edge on the adjacent face.
 */

export class Dcel {
    constructor(geometry) {
        this.vertices = Array.from({ length: geometry.attributes.position.count }, (_, i) => {
            return {
                point: new THREE.Vector3().fromBufferAttribute(geometry.attributes.position, i),
                edges: [],
                index: i
            };
        });
        const faceIndices = new THREE.Vector3();
        this.faces = Array.from({ length: geometry.index.count / 3 }, (_, i) => {
            faceIndices.fromArray(geometry.index.array, i * 3);
            const face = Face.create(this.vertices[faceIndices.x], this.vertices[faceIndices.y], this.vertices[faceIndices.z]);
            face.index = i;
            return face;
        });
        this.computeTwins();
    }

    forEdges(face, callback) {
        const start = face.edge;
        let e = start;
        while (true) {
            callback(e, face, this);
            e = e.next;
            if (e === start) {
                break;
            }
        }
    }

    computeTwins() {
        this.faces.forEach(face => {
            this.forEdges(face, e => {
                if(!e.twin) {
                    for (const other of e.head().edges) {
                        if (e.head() === other.tail() && e.tail() === other.head()) {
                            e.setTwin(other);
                            break;
                        }
                    }
                }
                e.head().edges.push(e);
                e.tail().edges.push(e);
            });
        });
    }

    adjacentFaces(faceIndex) {
        const face = this.faces[faceIndex];
        const adj = [];
        this.forEdges(face, e => {
            adj.push(e.twin.face);
        });
        return adj;
    }

    faceVertices(faceIndex) {
        const face = this.faces[faceIndex];
        const vertices = [];
        this.forEdges(face, e => {
            vertices.push(e.head().index);
        });
        return vertices;
    }
}

