const catchAsync = (fn) => (req, res, next) => {
    return fn(req, res, next).catch(next) // next is also a function that the error caught would automatically be passed into it as an argument. it can also be -> catch(err => next(err))
}

export default catchAsync
