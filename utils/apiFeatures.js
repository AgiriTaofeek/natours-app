export default class APIFeatures {
    constructor(query, queryString) {
        this.query = query
        this.queryString = queryString
    }
    // filter based on the fields in the DB e.g ?difficulty=easy or based on multiple fields ?difficulty=easy&duration[gte]=5
    filter() {
        const queryObj = { ...this.queryString }
        const excludedFields = ['page', 'sort', 'limit', 'fields']
        excludedFields.forEach((field) => delete queryObj[field])
        // console.log(this.queryString, queryObj)

        let queryStr = JSON.stringify(queryObj)
        queryStr = queryStr.replace(
            /\b(gte|gt|lte|lt)\b/g,
            (match) => `$${match}`
        )

        this.query = this.query.find(JSON.parse(queryStr))
        return this
    }

    sort() {
        if (this.queryString.sort) {
            const sortBy = this.queryString.sort.split(',').join(' ')
            // console.log(sortBy)
            this.query = this.query.sort(sortBy)
        } else {
            this.query = this.query.sort('-createdAt') //NOTE - default sort
            // console.log('sorting ')
        }
        return this
    }

    limitFields() {
        if (this.queryString.fields) {
            const fields = this.queryString.fields.split(',').join(' ')
            this.query = this.query.select(fields)
        } else {
            this.query = this.query.select('-__v') //NOTE - excludes the __V field in the res.json() but it would be in the DB
        }

        return this
    }

    // paginate() {
    //     const page = this.queryString.page * 1 || 1
    //     const limit = this.queryString.limit * 1 || 100
    //     const skip = (page - 1) * limit
    //     this.query = this.query.skip(skip).limit(limit)
    //     // console.log('pagination')
    //     return this
    // }

    async paginate() {
        const page = this.queryString.page * 1 || 1
        const limit = this.queryString.limit * 1 || 100
        const skip = (page - 1) * limit

        if (this.queryString.page) {
            const numDocuments = await this.query.model.countDocuments() // we had to use the model() method on this.query because this.query is a Query object since Tour.find() returns a Query object but countDocuments() method works for the Model object hence using the model() to convert the Query object to Model object
            console.log(numDocuments)
            if (skip >= numDocuments) {
                throw new Error('This page does not exist')
            }
        }
        this.query = this.query.skip(skip).limit(limit)
        return this
    }
}
