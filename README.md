# Polynate
A Low-poly Art Web App. Built on top of [PixiJS][1] and an implementation of
Dealaunay triangulation by [@ironwallaby][2] which can be found [here][3].

Details
-------
This project will be turned into an expandable application over time. Currently,
however, the setup is for a web interface and is not very extendable. Future
implementations will expose more functionality such as being able to add, move,
and remove points from the console or by hooking up your own events.

Future Functionality:
*	Show Triangles - show the current triangle map.
*	Grid Generation - generate points in a rectangular or triangular grid.
*	Random Generation - generate points placed randomly on the image.
*	Smart Generation - generate points intelligently, on edges and corners.
*	Rectangular Select - work with multiple points at a time.
*	PNG Export - (supported with right click on canvas), from menu.
*	JPG Export - from menu, select quality.
*	SVG Export - from menu.
*	Transparent Background - (PNG and SVG), export without background color.
*	Image Editing - Perform filters on background image, etc.
*	Customizability - Custom select, generate, and filter functionality.

[1]: http://www.pixijs.com/
[2]: https://github.com/ironwallaby
[3]: https://github.com/ironwallaby/delaunay