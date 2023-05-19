var documenterSearchIndex = {"docs":
[{"location":"","page":"Home","title":"Home","text":"CurrentModule = NaturalNeighbours","category":"page"},{"location":"#NaturalNeighbours","page":"Home","title":"NaturalNeighbours","text":"","category":"section"},{"location":"","page":"Home","title":"Home","text":"Documentation for NaturalNeighbours.","category":"page"},{"location":"","page":"Home","title":"Home","text":"","category":"page"},{"location":"","page":"Home","title":"Home","text":"Modules = [NaturalNeighbours]","category":"page"},{"location":"#NaturalNeighbours.AbstractDifferentiator","page":"Home","title":"NaturalNeighbours.AbstractDifferentiator","text":"abstract type AbstractDifferentiator end\n\nAbstract type for defining the method used for differentiating an interpolant or generating derivatives at data sites. \n\nDirect(): Generate derivatives directly with one least squares problem.\nIterative(): Generate derivatives iteratively: Gradients are estimated first, and then both gradients and Hessians are estimated with the initial gradients used to refine the results.  \n\n\n\n\n\n","category":"type"},{"location":"#NaturalNeighbours.AbstractInterpolator","page":"Home","title":"NaturalNeighbours.AbstractInterpolator","text":"abstract type AbstractInterpolator{D}\n\nAbstract type for defining the method used for evaluating an interpolant. D is, roughly, defined to be  the smoothness at the data sites (currently only relevant for Sibson). The available subtypes are:\n\nSibson(d): Interpolate via the Sibson interpolant, with C(d) continuity at the data sites. Only defined for D ∈ (0, 1). If D == 1, gradients must be provided.\nTriangle(d): Interpolate based on vertices of the triangle that the point resides in, with C(0) continuity at the data sites. D is ignored.\nNearest(d): Interpolate by returning the function value at the nearest data site. D doesn't mean much here (it could be D = ∞), and so it is ignored and replaced with 0.\nLaplace(d): Interpolate via the Laplace interpolant, with C(0) continuity at the data sites. D is ignored.\n\n\n\n\n\n","category":"type"},{"location":"#NaturalNeighbours.Direct","page":"Home","title":"NaturalNeighbours.Direct","text":"Direct()\n\nGenerate derivatives directly with one least squares problem.\n\n\n\n\n\n","category":"type"},{"location":"#NaturalNeighbours.Iterative","page":"Home","title":"NaturalNeighbours.Iterative","text":"Iterative()\n\nGenerate derivatives iteratively: Gradients are estimated first, and then both gradients and Hessians are estimated with the initial gradients used to refine the results.\n\n\n\n\n\n","category":"type"},{"location":"#NaturalNeighbours.Laplace","page":"Home","title":"NaturalNeighbours.Laplace","text":"Laplace()\n\nInterpolate using Laplace's coordinates.\n\n\n\n\n\n","category":"type"},{"location":"#NaturalNeighbours.Nearest","page":"Home","title":"NaturalNeighbours.Nearest","text":"Nearest()\n\nInterpolate by taking the function value at the nearest data site.\n\n\n\n\n\n","category":"type"},{"location":"#NaturalNeighbours.Sibson","page":"Home","title":"NaturalNeighbours.Sibson","text":"Sibson(d=0)\n\nInterpolate using Sibson's coordinates with C(d) continuity at the data sites.\n\n\n\n\n\n","category":"type"},{"location":"#NaturalNeighbours.Triangle","page":"Home","title":"NaturalNeighbours.Triangle","text":"Triangle()\n\nInterpolate using a piecewise linear interpolant over the underlying triangulation.\n\n\n\n\n\n","category":"type"},{"location":"#NaturalNeighbours.differentiate-Tuple{NaturalNeighbours.NaturalNeighboursInterpolant, Any}","page":"Home","title":"NaturalNeighbours.differentiate","text":"differentiate(itp::NaturalNeighboursInterpolant, order)\n\nDifferentiate a given interpolant itp up to degree order (1 or 2). The returned object is a  NaturalNeighboursDifferentiator struct, which is callable. \n\nFor calling the resulting struct, we define the following methods:\n\n(∂::NaturalNeighboursDifferentiator)(x, y, zᵢ, nc, id::Integer=1; parallel=false, method=default_diff_method(∂), kwargs...)\n(∂::NaturalNeighboursDifferentiator)(x, y, id::Integer=1; parallel=false, method=default_diff_method(∂), interpolant_method=Sibson(), rng=Random.default_rng(), kwargs...)\n(∂::NaturalNeighboursDifferentiator)(vals::AbstractVector, x::AbstractVector, y::AbstractVector; parallel=true, method=default_diff_method(∂), interpolant_method=Sibson(), kwargs...)\n(∂::NaturalNeighboursDifferentiator{I, O})(x::AbstractVector, y::AbstractVector; parallel=true, method=default_diff_method(∂), interpolant_method=Sibson(), kwargs...) where {I, O}\n\nThis method is useful if you already have an estimate for the function value, zᵢ, at the data site, (x, y), provided you also provide the NaturalCoordinates nc. id is the thread id.\nThis method is for scalars, with id referring to a thread id.\nThis method is an in-place method for vectors, storing ∂(x[i], y[i], 1) into vals[i].\nThis method is similar to (3), but vals is constructed and returned.\n\nThe available keyword arguments are:\n\nparallel=true: Whether to use multithreading. Ignored for the first two methods. \nmethod=default_diff_method(∂): Default method for evaluating the interpolant. default_diff_method(∂) returns Direct() if the underlying interpolant has no gradients, and Iterative() otherwise. The method must be a AbstractDifferentiator.\ninterpolant_method=Sibson(): The method used for evaluating the interpolant to estimate zᵢ for the latter three methods. See AbstractInterpolator for the avaiable methods.\nrng=Random.default_rng(): The random number generator used for estimating zᵢ for the latter three methods, or for constructing the natural coordinates.\nuse_cubic_terms=true: If estimating second order derivatives, whether to use cubic terms. Only relevant for method == Direct().\nalpha=0.1: If estimating second order derivatives, the weighting parameter used for estimating the second order derivatives. Only relevant for method == Iterative().\nuse_sibson_weight=true: Whether to weight the residuals in the associated least squares problems by the associated Sibson coordinates. Only relevant for method == Iterative() if order == 2.\n\nThe outputs are:\n\norder == 1: The scalar methods return a Tuple of the form (∂x, ∂y), while the vector methods return a vector of Tuples of the form (∂x, ∂y).\norder == 2: The scalar methods return a (∇, ℋ), where ∇ is a Tuple of the form (∂x, ∂y) and ℋ is a Tuple of the form (∂xx, ∂yy, ∂xy). The vector methods return a vector of (∇, ℋ)s.\n\n\n\n\n\n","category":"method"},{"location":"#NaturalNeighbours.generate_derivatives","page":"Home","title":"NaturalNeighbours.generate_derivatives","text":"generate_derivatives(\n    tri,\n    z,\n    derivative_caches=[DerivativeCache(tri) for _ in 1:Base.Threads.nthreads()],\n    neighbour_caches=[NaturalNeighboursCache(tri) for _ in 1:Base.Threads.nthreads()];\n    parallel=true,\n    method=Direct(),\n    use_cubic_terms=true,\n    alpha=0.1,\n    initial_gradients=dwrap(method) == Direct() ? nothing : generate_gradients(tri, z, derivative_caches, neighbour_caches; method=dwrap(method), parallel, rng)\n)\n\nGenerate derivatives at the data sites defined by the triangulation tri with associated function values tri.\n\nArguments\n\ntri: A Triangulation object.\nz: A vector of function values at the data sites.\nderivative_caches=[DerivativeCache(tri) for _ in 1:Base.Threads.nthreads()]: A vector of DerivativeCache objects, one for each thread.\nneighbour_caches=[NaturalNeighboursCache(tri) for _ in 1:Base.Threads.nthreads()]: A vector of NaturalNeighboursCache objects, one for each thread.\n\nKeyword Arguments\n\nparallel=true: Whether to use multithreading or not.\nmethod=Direct(): The method used for generating the derivatives. See AbstractDifferentiator.\nuse_cubic_terms=true: Whether to use cubic terms for estimating the second order derivatives. Only relevant for method == Direct().\nalpha=0.1: The weighting parameter used for estimating the second order derivatives. Only relevant for method == Iterative().\ninitial_gradients=dwrap(method) == Direct() ? nothing : generate_gradients(tri, z, derivative_caches, neighbour_caches; method=dwrap(method), parallel, rng): The initial gradients used for estimating the second order derivatives. Only relevant for method == Iterative().\n\nOutput\n\n∇: A vector of gradients at the data sites. Each element is a Tuple defining the gradient entries.\nℋ: A vector of Hessians at the data sites. Each element is a Tuple defining the Hessian entries in the form (H[1, 1], H[2, 2], H[1, 2]) (H[2, 1] is the same as H[2, 2]).\n\n\n\n\n\n","category":"function"},{"location":"#NaturalNeighbours.generate_gradients","page":"Home","title":"NaturalNeighbours.generate_gradients","text":"generate_gradients(\n    tri,\n    z,\n    derivative_caches=[DerivativeCache(tri) for _ in 1:Base.Threads.nthreads()],\n    neighbour_caches=[NaturalNeighboursCache(tri) for _ in 1:Base.Threads.nthreads()];\n    parallel=true\n)\n\nGenerate gradients at the data sites defined by the triangulation tri with associated function values tri.\n\nArguments\n\ntri: A Triangulation object.\nz: A vector of function values at the data sites.\nderivative_caches=[DerivativeCache(tri) for _ in 1:Base.Threads.nthreads()]: A vector of DerivativeCache objects, one for each thread.\nneighbour_caches=[NaturalNeighboursCache(tri) for _ in 1:Base.Threads.nthreads()]: A vector of NaturalNeighboursCache objects, one for each thread.\n\nKeyword Arguments\n\nparallel=true: Whether to use multithreading or not.\n\nOutput\n\n∇: A vector of gradients at the data sites. Each element is a Tuple defining the gradient entries.\n\n\n\n\n\n","category":"function"},{"location":"#NaturalNeighbours.interpolate-Tuple{DelaunayTriangulation.Triangulation, Any}","page":"Home","title":"NaturalNeighbours.interpolate","text":"interpolate(tri::Triangulation, z; gradient=nothing, hessian=nothing, derivatives=false, kwargs...)\ninterpolate(points, z; gradient=nothing, hessian=nothing, derivatives=false kwargs...)\ninterpolate(x::AbstractVector, y::AbstractVector, z; gradient=nothing, hessian=nothing, derivatives=false, kwargs...)\n\nConstruct an interpolant over the data z at the sites defined by the triangulation tri (or points, or (x, y)). See the Output  section for a description of how to use the interpolant itp.\n\nKeyword Arguments\n\ngradient=nothing: The gradients at the corresponding data sites of z. Will be generated if isnothing(gradient) and derivatives==true.\nhessian=nothing: The hessians at the corresponding data sites of z. Will be generated if isnothing(hessian) and derivatives==true.\nderivatives=false: Whether to generate derivatives at the data sites of z. See also generate_derivatives.\nkwargs...: Keyword arguments passed to generate_derivatives.\n\nOutput\n\nThe returned value is a NaturalNeighboursInterpolant struct. This struct is callable, with the following methods defined:\n\n(itp::NaturalNeighboursInterpolant)(x, y, id::Integer=1; parallel=false, method=Sibson(), kwargs...)\n(itp::NaturalNeighboursInterpolant)(vals::AbstractVector, x::AbstractVector, y::AbstractVector; parallel=true, method=Sibson(), kwargs...)\n(itp::NaturalNeighboursInterpolant)(x::AbstractVector, y::AbstractVector; parallel=true, method=Sibson(), kwargs...)\n\nThe first method is for scalars, with id referring to a thread id. \nThis method is an in-place method for vectors, storing itp(x[i], y[i]) into vals[i]. \nThis method is similar to (2), but vals is constructed and returned. \n\nIn each method, method defines the method used for evaluating the interpolant, which is some AbstractInterpolator. For the first  method, parallel is ignored, but for the latter two methods it defines whether to use multithreading or not for evaluating the interpolant at  all the points. The kwargs... argument is passed into add_point! from DelaunayTriangulation.jl, e.g. you could pass some rng.\n\n\n\n\n\n","category":"method"}]
}
