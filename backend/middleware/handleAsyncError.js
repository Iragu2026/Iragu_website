export default (myErrorFunc) => (req, res, next) => {
    Promise.resolve(myErrorFunc(req, res, next)).catch(next);
};