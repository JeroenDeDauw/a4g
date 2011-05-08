$().ready(function() {
	$(window).resize(function() {
		$('#map').height($(window).height() - $('#map').offset().top);
	});
	$(window).resize();
});
