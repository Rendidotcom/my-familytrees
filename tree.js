body {
  font-family: Arial, sans-serif;
  background: #f4f7fa;
  margin: 0;
  padding: 0;
}

#treeContainer {
  padding: 40px;
  display: flex;
  justify-content: center;
  flex-wrap: nowrap;
  overflow-x: auto;
}

/* Node Anggota */
.node {
  background: #ffffff;
  border: 2px solid #4CAF50;
  border-radius: 10px;
  padding: 10px;
  width: 150px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.node img {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 5px;
}

.name {
  font-weight: bold;
  font-size: 16px;
  color: #000;
}

.rel {
  font-size: 13px;
  color: #666;
}

/* Struktur garis */
.generation-level {
  text-align: center;
}

.pair {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.line {
  width: 60px;
  height: 2px;
  background: #444;
}

/* Garis ke anak */
.vertical-line {
  width: 2px;
  height: 50px;
  background: #333;
  margin: 10px auto;
}

.children {
  display: flex;
  justify-content: center;
  gap: 20px;
}
