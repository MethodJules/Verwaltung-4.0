(function ($, Drupal, drupalSettings) {
    var initialized;
    function init() {
        if(!initialized) {
            initialized = true;
        //Hier deinen Code reinschreiben
        //Sollte ohne document ready gehen
        var w = 1200;
        var h = 1200;
        var linkDistance=200;
        div = 'person_network_graphic';

        console.log(drupalSettings);

       var dataset = drupalSettings.person_network.graphdata;


        var praedikate = drupalSettings.person_network.graphdata.praedikate;

        var colors = d3.scale.category10();


        var svg = d3.select('#' + div).append("svg").attr({"width":w,"height":h})
            .call(d3.behavior.zoom().on("zoom", function () {
                svg.attr("transform", "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")")
            }))
            .append("g");

        console.log("Created div");

        var force = d3.layout.force()
            .nodes(dataset.nodes)
            .links(dataset.edges)
            .size([w,h])
            .linkDistance([linkDistance])
            .charge([-500])
            .theta(0.1)
            .gravity(0.05)
            .start();



        var edges = svg.selectAll("line")
            .data(dataset.edges)
            .enter()
            .append("line")
            .attr("id",function(d,i) {return 'edge'+i})
            .attr('marker-end','url(#arrowhead)')
            .style("stroke","#ccc")
            .style("pointer-events", "none");

        var nodes = svg.selectAll("circle")
            .data(dataset.nodes)
            .enter()
            .append("circle")
            .attr({"r":15})
            .style("fill",function(d,i){return colors(i);})
            //.style("fill", "green")
            .call(force.drag)
            .on('dblclick', connectedNodes);

        var nodelabels = svg.selectAll(".nodelabel")
            .data(dataset.nodes)
            .enter()
            .append("a").attr("xlink:href", function(d){return d.link;})
            .attr({"type":function(d){return d.type;}})
            .append("text")
            .attr({"x":function(d){return d.x;},
                "y":function(d){return d.y;},
                "class":"nodelabel",
                'font-size':12,
                "stroke":"black"})
            .text(function(d){return d.name;});

        var edgepaths = svg.selectAll(".edgepath")
            .data(dataset.edges)
            .enter()
            .append('path')
            .attr({'d': function(d) {return 'M '+d.source.x+' '+d.source.y+' L '+ d.target.x +' '+d.target.y},
                'class':'edgepath',
                'fill-opacity':0,
                'stroke-opacity':0,
                'fill':'blue',
                'stroke':'red',
                'id':function(d,i) {return 'edgepath'+i}})
            .style("pointer-events", "none");

        var edgelabels = svg.selectAll(".edgelabel")
            .data(dataset.edges)
            .enter()
            .append('text')
            .style("pointer-events", "none")
            .attr({'class':'edgelabel',
                'id':function(d,i){return 'edgelabel'+i},
                'dx':80,
                'dy':0,
                'font-size':10,
                'fill':'#aaa'});

        edgelabels.append('textPath')
            .attr('xlink:href',function(d,i) {return '#edgepath'+i})
            .style("pointer-events", "none")
            .text(function(d,i){return praedikate[i]});

        svg.append('defs').append('marker')
            .attr({'id':'arrowhead',
                'viewBox':'-0 -5 10 10',
                'refX':25,
                'refY':0,
                //'markerUnits':'strokeWidth',
                'orient':'auto',
                'markerWidth':10,
                'markerHeight':10,
                'xoverflow':'visible'})
            .append('svg:path')
            .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
            .attr('fill', '#ccc')
            .attr('stroke','#ccc');


        force.on("tick", function(){

            edges.attr({"x1": function(d){return d.source.x;},
                "y1": function(d){return d.source.y;},
                "x2": function(d){return d.target.x;},
                "y2": function(d){return d.target.y;}
            });

            nodes.attr({"cx":function(d){return d.x;},
                "cy":function(d){return d.y;}
            });

            nodelabels.attr("x", function(d) { return d.x; })
                .attr("y", function(d) { return d.y; });

            edgepaths.attr('d', function(d) { var path='M '+d.source.x+' '+d.source.y+' L '+ d.target.x +' '+d.target.y;
                //console.log(d)
                return path});

            edgelabels.attr('transform',function(d,i){
                if (d.target.x<d.source.x){
                    bbox = this.getBBox();
                    rx = bbox.x+bbox.width/2;
                    ry = bbox.y+bbox.height/2;
                    return 'rotate(180 '+rx+' '+ry+')';
                }
                else {
                    return 'rotate(0)';
                }
            });

            //nodes.each(collide(0.5));
        });
        //------------------------------------------------------------
        //Toggle stores whether the highlighting is on
        var toggle = 0;
        //Create an array logging what is connected to what
        var linkedByIndex = {};
        for (i = 0; i < dataset.nodes.length; i++) {
            linkedByIndex[i + "," + i] = 1;
        };
        dataset.edges.forEach(function (d) {
            linkedByIndex[d.source.index + "," + d.target.index] = 1;
        });
        //This function looks up whether a pair are neighbours
        function neighboring(a, b) {
            return linkedByIndex[a.index + "," + b.index];
        }
        function connectedNodes() {
            if (toggle == 0) {
                //Reduce the opacity of all but the neighbouring nodes
                d = d3.select(this).node().__data__;
                nodes.style("opacity", function (o) {
                    return neighboring(d, o) | neighboring(o, d) ? 1 : 0.05;
                });
                edges.style("opacity", function (o) {
                    return d.index == o.source.index | d.index == o.target.index ? 1 : 0.1;
                });
                //Reduce the op
                toggle = 1;
            } else {
                //Put them back to opacity=1
                nodes.style("opacity", 1);
                edges.style("opacity", 1);
                toggle = 0;
            }
        }

        //-------Collision Detection
        var padding = 1, // separation between circles
            radius=8;
        function collide(alpha) {
            var quadtree = d3.geom.quadtree(graph.nodes);
            return function(d) {
                var rb = 2*radius + padding,
                    nx1 = d.x - rb,
                    nx2 = d.x + rb,
                    ny1 = d.y - rb,
                    ny2 = d.y + rb;
                quadtree.visit(function(quad, x1, y1, x2, y2) {
                    if (quad.point && (quad.point !== d)) {
                        var x = d.x - quad.point.x,
                            y = d.y - quad.point.y,
                            l = Math.sqrt(x * x + y * y);
                        if (l < rb) {
                            l = (l - rb) / l * alpha;
                            d.x -= x *= l;
                            d.y -= y *= l;
                            quad.point.x += x;
                            quad.point.y += y;
                        }
                    }
                    return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
                });
            };
        }


    }









    }
    Drupal.behaviors.person_network = {
      attach: function (context, settings) {
        // can access setting from 'drupalSettings';
        init();
      }
    };
    })(jQuery, Drupal, drupalSettings);