#!/usr/bin/env python3
import os
import cv2 as cv
import json


def main():
    dir = os.path.dirname(os.path.realpath(__file__))
    images_dir = os.path.join(dir, 'images')
    image_files = []
    for i in range(0, 50):
        image_files.append(os.path.join(images_dir, f'{i + 1}.jpg'))
    surf = cv.xfeatures2d_SURF.create()
    matcher = cv.DescriptorMatcher_create(cv.DescriptorMatcher_FLANNBASED)
    images = []
    key_points = []
    descriptors = []

    for i in image_files:
        image_path = os.path.join(images_dir, i)
        img = cv.imread(cv.samples.findFile(image_path))
        images.append(img)
        kp, des = surf.detectAndCompute(img, None)
        key_points.append(kp)
        descriptors.append(des)

    matches_infos = []
    num_images = len(images)
    for i in range(0, num_images):
        for j in range(0, i):
            try:
                knn_matches = matcher.knnMatch(descriptors[i], descriptors[j], 2)
                ratio_thresh = 0.7
                good_matches = []
                for m,n in knn_matches:
                    if m.distance < ratio_thresh * n.distance:
                        good_matches.append(m)
                # matches = bf.match(descriptors[i], descriptors[j])
                matches = good_matches
                matches = sorted(matches, key=lambda x: x.distance)
                num_matches = min(5, len(matches))
                for idx in range(0, num_matches):
                    mat = matches[idx]
                    img1_idx = mat.queryIdx
                    img2_idx = mat.trainIdx
                    (x1, y1) = key_points[i][img1_idx].pt
                    (x2, y2) = key_points[j][img2_idx].pt
                    matches_infos.append({
                        'image1': i,
                        'image2': j,
                        'position1': {'x': x1, 'y': y1},
                        'position2': {'x': x2, 'y': y2}
                    })
            except:
                pass
    # print(json.dumps(matches_infos, indent = 2))
    with open(os.path.join(dir, 'matches.json'), 'w') as file:
        file.write(json.dumps(matches_infos, indent = 2))


if __name__ == '__main__':
    main()
