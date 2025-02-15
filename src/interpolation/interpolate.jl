"""
    interpolate(tri::Triangulation, z; gradient=nothing, hessian=nothing, derivatives=false, kwargs...)
    interpolate(points, z; gradient=nothing, hessian=nothing, derivatives=false, kwargs...)
    interpolate(x::AbstractVector, y::AbstractVector, z; gradient=nothing, hessian=nothing, derivatives=false, kwargs...)

Construct an interpolant over the data `z` at the sites defined by the triangulation `tri` (or `points`, or `(x, y)`). See the Output 
section for a description of how to use the interpolant `itp`.

!!! warning "Missing vertices"

    When the underlying triangulation, `tri`, has points in `get_points(tri)` that are not 
    vertices of the triangulation itself, the associated derivatives (relevant only if `derivatives=true`) at these points
    will be set to zero.

# Keyword Arguments 
- `gradient=nothing`: The gradients at the corresponding data sites of `z`. Will be generated if `isnothing(gradient)` and `derivatives==true`.
- `hessian=nothing`: The hessians at the corresponding data sites of `z`. Will be generated if `isnothing(hessian)` and `derivatives==true`.
- `derivatives=false`: Whether to generate derivatives at the data sites of `z`. See also [`generate_derivatives`](@ref).
- `kwargs...`: Keyword arguments passed to [`generate_derivatives`](@ref).

# Output 
The returned value is a `NaturalNeighboursInterpolant` struct. This struct is callable, with the following methods defined:

    (itp::NaturalNeighboursInterpolant)(x, y, id::Integer=1; parallel=false, method=Sibson(), project = true, kwargs...)
    (itp::NaturalNeighboursInterpolant)(vals::AbstractVector, x::AbstractVector, y::AbstractVector; parallel=true, method=Sibson(), project = true, kwargs...)
    (itp::NaturalNeighboursInterpolant)(x::AbstractVector, y::AbstractVector; parallel=true, method=Sibson(), project = true, kwargs...)

1. The first method is for scalars, with `id` referring to a thread id. 
2. This method is an in-place method for vectors, storing `itp(x[i], y[i])` into `vals[i]`. 
3. This method is similar to (2), but `vals` is constructed and returned. 

In each method, `method` defines the method used for evaluating the interpolant, which is some [`AbstractInterpolator`](@ref). For the first 
method, `parallel` is ignored, but for the latter two methods it defines whether to use multithreading or not for evaluating the interpolant at 
all the points. The `kwargs...` argument is passed into `add_point!` from DelaunayTriangulation.jl, e.g. you could pass some `rng`. Lastly, 
the `project` argument determines whether extrapolation is performed by projecting any exterior points onto the boundary of the convex hull 
of the data sites and performing two-point interpolation, or to simply replace any extrapolated values with `Inf`.

!!! performance 

    For the best performance when evaluating the interpolant at many points, either of the second or 
    third methods are preferred over repeatedly calling the first.

!!! warning

    Until we implement ghost point extrapolation, behaviour near the convex hull of your data sites may in some cases be undesirable,
    despite the extrapolation method we describe above, even for points that are inside the convex hull. If you want to control this 
    behaviour so that you discard any points that are very close to the convex hull, see `identify_exterior_points` and the `tol` 
    keyword argument.
"""
interpolate(tri::Triangulation, z; gradient=nothing, hessian=nothing, kwargs...) = NaturalNeighboursInterpolant(tri, z, gradient, hessian; kwargs...)

"""
    abstract type AbstractInterpolator{D}

Abstract type for defining the method used for evaluating an interpolant. `D` is, roughly, defined to be 
the smoothness at the data sites (currently only relevant for `Sibson`). The available subtypes are:

- `Sibson(d)`: Interpolate via the Sibson interpolant, with `C(d)` continuity at the data sites. Only defined for `D ∈ (0, 1)`. If `D == 1`, gradients must be provided.
- `Triangle(d)`: Interpolate based on vertices of the triangle that the point resides in, with `C(0)` continuity at the data sites. `D` is ignored.
- `Nearest(d)`: Interpolate by returning the function value at the nearest data site. `D` doesn't mean much here (it could be `D = ∞`), and so it is ignored and replaced with `0`.
- `Laplace(d)`: Interpolate via the Laplace interpolant, with `C(0)` continuity at the data sites. `D` is ignored.
- `Farin(d)`: Interpolate using the Farin interpolant, with `C(1)` continuity at the data sites. `d` is ignored.
- `Hiyoshi(d)`: Interpolate using the Hiyoshi interpolant, with `C(d)` continuity at the data sites. Currently, only defined for `d == 2`.

Our implementation of `Sibson(0)`'s coordinates follows [this article](https://gwlucastrig.github.io/TinfourDocs/NaturalNeighborTinfourAlgorithm/index.html) with some simple modifications.
"""
abstract type AbstractInterpolator{D} end
@doc """
    Sibson(d=0)

Interpolate using Sibson's coordinates with `C(d)` continuity at the data sites.
""" struct Sibson{D} <: AbstractInterpolator{D}
    Sibson(d) = d ∈ (0, 1) ? new{d}() : throw(ArgumentError("The Sibson interpolant is only defined for d ∈ (0, 1)."))
    Sibson() = new{0}()
end
struct Triangle{D} <: AbstractInterpolator{D}
    allow_cache::Bool
    s::Dict{NTuple{3,Int},NTuple{9,Float64}}
end
Triangle{D}(; allow_cache=true) where {D} = Triangle{D}(allow_cache, Dict{NTuple{3,Int},Float64}())
Base.empty!(method::Triangle) = empty!(method.s)

function populate_cache!(method::Triangle, tri::Triangulation)
    method.allow_cache || return method
    if length(method.s) == DelaunayTriangulation.num_solid_triangles(tri)
        return method
    elseif !isempty(method.s) # user is using a new triangulation
        empty!(method)
    end
    for T in each_solid_triangle(tri)
        V = sort_triangle(T)
        i, j, k = triangle_vertices(V)
        method.s[(i, j, k)] = _compute_triangle_shape_coefficients(tri, i, j, k)
    end
    return method
end

struct Nearest{D} <: AbstractInterpolator{D} end
struct Laplace{D} <: AbstractInterpolator{D} end
struct Farin{D} <: AbstractInterpolator{D} end
struct Hiyoshi{D} <: AbstractInterpolator{D} end
@doc """
    Triangle(; allow_cache = true)

Interpolate using a piecewise linear interpolant over the underlying triangulation.

!!! note "Cached coordinates with `allow_cache=true`"

    The `Triangle()` interpolator is special as it will cache the coordinates used 
    for each triangle. In particular, when an interpolator is evaluated with the 
    `Triangle()` method, the object returned from `Triangle()` will store all 
    the coordinates. For this reason, if you want to reuse `Triangle()` for different 
    evaluations of the interpolant, you should be sure to reuse the same instance rather 
    than reinstantiating it every single time. If you do not want this behaviour, set 
    `allow_cache = false`.

    If you only ever call the scalar-argument version of the interpolant, no caching will 
    be done even with `allow_cache = true`.
""" Triangle(; allow_cache=true) = Triangle{0}(; allow_cache)
Triangle(d; allow_cache=true) = Triangle(; allow_cache)
@doc """
    Nearest()

Interpolate by taking the function value at the nearest data site.
""" Nearest() = Nearest{0}()
Nearest(d) = Nearest{d}()
@doc """
    Laplace()

Interpolate using Laplace's coordinates.
""" Laplace() = Laplace{0}()
Laplace(d) = Laplace()
@doc """
    Farin()

Interpolate using Farin's C(1) interpolant.
""" Farin() = Farin{1}()
Farin(d) = Farin()
@doc """
    Hiyoshi(d)

Interpolate using Hiyoshi's C(d) interpolant. Hiyoshi's interpolant C(0) is not yet implemented, 
but we do not make any conversions to C(2) like in e.g. `Farin()`, e.g. `Farin()` gets 
converted to `Farin(1)` but, to support possible later versions, `Hiyoshi()` does not get 
converted to `Hiyoshi(2)`.
""" Hiyoshi() = Hiyoshi{0}()
Hiyoshi(d) = Hiyoshi{d}()

@inline iwrap(s::AbstractInterpolator) = s
@inline function iwrap(s::Symbol) # this is bad design, should just prohibit symbols
    if s == :sibson
        return Sibson()
    elseif s == :sibson_1
        return Sibson(1)
    elseif s == :triangle
        return Triangle()
    elseif s == :nearest
        return Nearest()
    elseif s == :laplace
        return Laplace()
    elseif s == :farin
        return Farin()
    elseif s == :hiyoshi_2
        return Hiyoshi(2)
    else
        throw(ArgumentError("Unknown interpolator."))
    end
end

@inline function interpolate(points, z; gradient=nothing, hessian=nothing, kwargs...)
    tri = triangulate(points, delete_ghosts=false)
    return interpolate(tri, z; gradient, hessian, kwargs...)
end
@inline function interpolate(x::AbstractVector, y::AbstractVector, z; gradient=nothing, hessian=nothing, kwargs...)
    @assert length(x) == length(y) == length(z) "x, y, and z must have the same length."
    points = [(ξ, η) for (ξ, η) in zip(x, y)]
    return interpolate(points, z; gradient, hessian, kwargs...)
end

function (itp::NaturalNeighboursInterpolant)(x, y, id::Integer=1; parallel=false, method=Sibson(), kwargs...)
    tri = get_triangulation(itp)
    F = number_type(tri)
    p = (F(x), F(y))
    cache = get_neighbour_cache(itp, id)
    method = iwrap(method)
    # method isa Triangle && populate_cache!(method, tri)
    return _eval_interp(method, itp, p, cache; kwargs...)
end

function (itp::NaturalNeighboursInterpolant)(vals::AbstractVector, x::AbstractVector, y::AbstractVector; parallel=true, method=Sibson(), kwargs...)
    @assert length(x) == length(y) == length(vals) "x, y, and vals must have the same length."
    method = iwrap(method)
    method isa Triangle && populate_cache!(method, get_triangulation(itp))
    if !parallel
        for i in eachindex(x, y)
            vals[i] = itp(x[i], y[i], 1; method, kwargs...)
        end
    else
        caches = get_neighbour_cache(itp)
        nt = length(caches)
        chunked_iterator = index_chunks(vals; n=nt)
        Threads.@threads for (chunk_id, xrange) in enumerate(chunked_iterator)
            for i in xrange
                vals[i] = itp(x[i], y[i], chunk_id; method, kwargs...)
            end
        end
    end
    return nothing
end
@inline function (itp::NaturalNeighboursInterpolant)(x::AbstractVector, y::AbstractVector; parallel=true, method=Sibson(), kwargs...)
    @assert length(x) == length(y) "x and y must have the same length."
    n = length(x)
    tri = get_triangulation(itp)
    F = number_type(tri)
    vals = zeros(F, n)
    method = iwrap(method)
    method isa Triangle && populate_cache!(method, tri)
    itp(vals, x, y; method, parallel, kwargs...)
    return vals
end
