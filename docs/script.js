const map = d3.select("#map")
    .append("svg")
    .attr("width", 600)
    .attr("height", 600);

const mapViz = map.append("g");

const colorScale = d3.scaleLinear()
    .domain([100, 50, 0])
    .range(["#ba3434", "#ffffff", "#3470ba"]);

var tooltip = d3.select("body")
    .append("div")
    .attr("id", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("pointer-events", "none")
        .style("background-color", "#ffffff")
        .style("font-color", "black")
        .style("box-shadow", "3px 3px 5px rgba(0, 0, 0, 0.3)")
        .style("display", "flex")
        .style("flex-direction", "column");

var tooltipContent = tooltip.append("div")
    .attr("id", "tooltip-content")
        .style("padding", "0px 20px 0px 20px");

var tooltipCounty = tooltipContent.append("p")
    .style("text-align", "center")
    .style("font-weight", "bold");

var tooltipVotes = tooltipContent.append("p")

Promise.all([
    d3.csv("data/pres_data.csv"),
    d3.json("data/us-counties.json")
]).then(function([resultsData, usData]) {
    countiesData = topojson.feature(usData, usData.objects.counties).features;
    stateData = topojson.feature(usData, usData.objects.states).features.filter((d) => d.id == 13);
    gaData = countiesData.filter(d => String(d.id).startsWith("13"));

    projection = d3.geoIdentity().fitSize([500, 500], stateData[0]);
    
    const geoGen = d3.geoPath()
        .projection(projection);

    var map = mapViz.selectAll("path")
        .data(gaData)
        .enter()
        .append("path")
        .attr("d", geoGen)
        .attr("fill", "white")
        .attr("stroke", "black")
        .attr("transform", "rotate(5) translate(100, 0)");

    var updateMap = function(elecDate) {
        var partyData = resultsData.filter(d => d.date == elecDate & (d.candidate_name.includes("REP") | d.candidate_name.includes("Rep")));

        for (i = 0; i < gaData.length; i++) {
            var mapCounty = gaData[i].properties.name;

            for (j = 0; j < partyData.length; j++) {
                var partyCounty = partyData[j].county_name;

                if (partyCounty.includes(mapCounty)) {
                    gaData[i].properties.value = Number(partyData[j].party_perc);
                    break;
                };
            };
        };

        map
            .transition()
            .duration(500)
            .attr("fill", d => colorScale(d.properties.value));
    };

    var showTooltip = function(e, d) {
        tooltipCounty.html(d.properties.name + " County");

        var tooltipHeight = tooltip.node().getBoundingClientRect().height;
        var tooltipWidth = tooltip.node().getBoundingClientRect().width;
        
        if (e.pageX + tooltipWidth > window.innerWidth - 10) {
            tooltip
                .style("left", (e.pageX - tooltipWidth - 10) + "px")
                .style("top", (e.pageY - tooltipHeight - 10) + "px")
                .style("opacity", 1);
        } else {
            tooltip
                .style("left", (e.pageX + 10) + "px")
                .style("top", (e.pageY - tooltipHeight - 10) + "px")
                .style("opacity", 1);
        };
    };

    var hideTooltip = function(e, d) {
        tooltip.transition()
            .duration(100)
            .style("opacity", 0);
    };

    map
        .on("mouseover", showTooltip)
        .on("mousemove", showTooltip)
        .on("mouseout", hideTooltip);

    updateMap("November 8, 2016");
    
    d3.select("#select-election")
        .on("change", function(event) {
            var selectedValue = this.value; 
            updateMap(selectedValue);
        });
});
