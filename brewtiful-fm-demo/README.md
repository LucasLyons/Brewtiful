# Brewtiful LightFM Demo

A demonstration of the collaborative filtering model training pipeline used to power [Brewtiful](https://www.brewtifulapp.com/)'s beer recommendation system.

## Overview

This repo trains a LightFM matrix factorization model on the [Beer Reviews dataset](https://www.kaggle.com/datasets/rdoume/beerreviews) from Kaggle (1.5M+ reviews, 66K beers, 33K users) to demonstrate the methodology behind Brewtiful's recommendation engine.

## Pipeline

1. **[Data Exploration](01_data-exploration.ipynb)** - Load and analyze the Beer Reviews dataset
2. **[Data Preprocessing](02_data-preprocessing.ipynb)** - Clean data, create weighted interactions, temporal train/val/test splits
3. **[Model Training](03_model-training.ipynb)** - Train baseline and feature-enhanced LightFM models with Optuna hyperparameter optimization
4. **[Model Evaluation](04_model-evaluation.ipynb)** - Compare models on validation set using precision@K, recall@K, AUC, and item coverage
5. **[Final Training](05_final-training.ipynb)** - Train final model on full dataset

## Key Features

### Weighted Implicit Feedback
Ratings are transformed into confidence weights for LightFM:
- 0-2 stars → 0.0 (negative signal)
- 2-3 stars → 0.01 (weak positive)
- 3-4 stars → 0.09 (moderate positive)
- 4-5 stars → 0.9 (strong positive)

### Temporal Splitting
Temporal splits simulate production:
- Power users (≥300 reviews): last 200 reviews reserved for validation/test
- Regular users: all data for training

### Two Models: Pure MF vs. Feature-Enhanced

**Winner: Feature-enhanced model** selected for production due to:
- Superior item-item similarity matching
- Improved item catalog coverage (At K=100: ~32.5% coverage vs ~14% (~132% improvement))
- Cold-start capability for new beers

## Production vs Demo

See [comparison document](06_demo-vs-prod-comparison.md) for differences between this demo and Brewtiful's production model:
- Production dataset is 2x more sparse
- Production uses k-means clustering on embeddings for final recommendations
- Both selected feature-enhanced models

## Requirements

- Python 3.10+
- LightFM-next (for forwards-compatibility with python 3.10+)
- Optuna
- pandas, numpy, scipy
- scikit-learn
- matplotlib, seaborn

## Usage

Run notebooks sequentially (01 → 05) to reproduce the training pipeline.
