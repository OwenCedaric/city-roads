import tinycolor from 'tinycolor2';

export default {
  /**
   * This is our caching backend
   */
  // CloudFront S3 CDN road cache backend
  areaServer: 'https://d2uf7yjjctyxf.cloudfront.net/nov-02-2020',

  getDefaultLineColor() {
    return tinycolor('rgba(61, 68, 81, 0.82)');
  },
  getLabelColor() {
    return tinycolor('#3d4451');
  },

  getBackgroundColor() {
    return tinycolor('#fbf9f6');
  }
}