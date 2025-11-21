/* Free Unlimited Treant.js */

(function () {
  this.Treant = function (chart_config) {
    this.config = chart_config;
    this.tree = {};
    this.drawn = false;

    this.container = document.getElementById(chart_config.container);
    if (!this.container) {
      console.error("Container '" + chart_config.container + "' not found.");
      return;
    }

    this.init();
  };

  Treant.prototype.init = function () {
    this.tree = new TreeStore(this.config.nodeStructure);
    this.render();
  };

  Treant.prototype.render = function () {
    if (!this.tree) return;

    this.container.innerHTML = "";
    let svg = Raphael(this.container, "100%", "100%");

    this.drawNode(svg, this.tree, this.container.offsetWidth / 2, 40);
  };

  Treant.prototype.drawNode = function (svg, node, x, y) {
    let boxWidth = 150;
    let boxHeight = 80;

    let isDead = node.data.status === "dead";

    // box styling
    let rect = svg.rect(x, y, boxWidth, boxHeight, 10)
      .attr({
        fill: isDead ? "#ececec" : "#d4ffd7",
        stroke: isDead ? "#888" : "#27ae60",
        "stroke-width": 2
      });

    // name text
    svg.text(x + boxWidth / 2, y + 20, node.data.name || "No name")
      .attr({
        "font-size": 14,
        "font-weight": "bold"
      });

    // second line: spouse
    if (node.data.spouse) {
      svg.text(x + boxWidth / 2, y + 45, "Spouse: " + node.data.spouse)
        .attr({ "font-size": 12 });
    }

    // children drawing
    let childX = x - (node.children.length * 200) / 2;

    node.children.forEach((child) => {
      let childY = y + 150;

      // draw line connecting parent-child
      svg.path(
        `M${x + boxWidth / 2},${y + boxHeight} L${childX + boxWidth / 2},${childY}`
      );

      this.drawNode(svg, child, childX, childY);
      childX += 200;
    });
  };

  // TREE STORE
  function TreeStore(rawNode) {
    this.data = rawNode;
    this.children = [];

    if (rawNode.children) {
      rawNode.children.forEach((ch) => {
        this.children.push(new TreeStore(ch));
      });
    }
  }
})();
