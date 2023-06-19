# Copyright (c) Jupyter Development Team.
# Distributed under the terms of the Modified BSD License.
FROM jupyter/minimal-notebook:latest

RUN python3 -m pip install --no-cache-dir \
        matplotlib \
        numpy \
        astropy \
        jupyterlab-git

# docker build -t minimal-notebook-xinyu .
# after building, do the following to register with aws ecr:
# https://docs.aws.amazon.com/AmazonECS/latest/userguide/create-container-image.html
# - aws ecr create-repository --repository-name bigcat-jupyter-repository --region ap-southeast-2

# docker tag minimal-notebook-xinyu 647731306132.dkr.ecr.ap-southeast-2.amazonaws.com/bigcat-jupyter-repository
# docker login -u AWS -p $(aws ecr get-login-password --region ap-southeast-2) 647731306132.dkr.ecr.ap-southeast-2.amazonaws.com
# docker push 647731306132.dkr.ecr.ap-southeast-2.amazonaws.com/bigcat-jupyter-repository


# docker tag minimal-notebook-xinyu 306604607287.dkr.ecr.ap-southeast-2.amazonaws.com/bigcat-jupyter-repository
# docker login -u AWS -p $(aws ecr get-login-password --region ap-southeast-2) 306604607287.dkr.ecr.ap-southeast-2.amazonaws.com
# docker push 647731306132.dkr.ecr.ap-southeast-2.amazonaws.com/bigcat-jupyter-repository
