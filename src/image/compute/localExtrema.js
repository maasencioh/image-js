
/**
 * Returns an array of object with position.
 * @memberof Image
 * @param mask region of the image that is analyzed. The rest is omitted.
 * @param region 1, 2 or 3. Define the region around each points that is analyzed. 1 corresponds to 4 cross points, 2 to
 *        the 8 points around and 3 to the 12 points around the central pixel
 * @param removeClosePoints Remove pts which have a distance between them smaller than this param.
 * @param algorithm chose between min or max local.
 * @returns {[number]} Array having has size the number of channels
 */


export default function localExtrema(
    {
        removeClosePoints = 0,
        region = 3,
        algorithm = 'max',
        mask
    } = {}
) {
    let searchMaxima = true;
    if (algorithm.toLowerCase() === 'min') {
        searchMaxima = false;
    }

    let image = this;
    this.checkProcessable('localExtrema', {
        bitDepth: [8, 16],
        components: 1
    });
    region *= 4;

    let dx = [+1, 0, -1, 0, +1, +1, -1, -1, +2, 0, -2, 0, +2, +2, -2, -2];
    let dy = [0, +1, 0, -1, +1, -1, +1, -1, 0, +2, 0, -2, +2, -2, +2, -2];
    let shift = (region <= 8) ? 1 : 2;
    let points = [];
    for (let currentY = shift; currentY < image.height - shift; currentY++) {
        for (let currentX = shift; currentX < image.width - shift; currentX++) {
            if (mask && !mask.getBitXY(currentX, currentY)) {
                continue;
            }
            let counter = 0;
            let currentValue = image.data[currentX + currentY * image.width];
            for (let dir = 0; dir < region; dir++) {
                if (searchMaxima) {
                    if (image.data[currentX + dx[dir] + (currentY + dy[dir]) * image.width] <= currentValue) {
                        counter++;
                    }
                } else {
                    if (image.data[currentX + dx[dir] + (currentY + dy[dir]) * image.width] >= currentValue) {
                        counter++;
                    }
                }
            }
            if (counter === region) {
                points.push([currentX, currentY]);
            }
        }
    }
    // TODO How to make a more performant and general way
    // we don't deal correctly here with groups of points that should be grouped if at the
    // beginning one of them is closer to another
    // Seems that we would ened to calculate a matrix and then split this matrix in 'independant matrices'
    // Or to assign a cluster to each point and regroup them if 2 clusters are close to each other
    // later approach seems much better
    if (removeClosePoints > 0) {
        for (let i = 0; i < points.length; i++) {
            for (let j = i + 1; j < points.length; j++) {
                if (Math.sqrt(Math.pow(points[i][0] - points[j][0], 2) + Math.pow(points[i][1] - points[j][1], 2)) < removeClosePoints) {
                    points[i][0] = (points[i][0] + points[j][0]) >> 1;
                    points[i][1] = (points[i][1] + points[j][1]) >> 1;
                    points.splice(j, 1);
                    j--;
                }
            }
        }
    }
    return points;
}

