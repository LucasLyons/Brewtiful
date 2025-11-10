# Comparison of Demo Training vs Prod Training

Here I will briefly discuss the similarities and differences between the training results displayed in this repo and the training results when I trained the model that powers Brewtiful.

## Features or No Features?
In both training processes, the critical choice was between the base model and the feature-enhanced model. In both cases, the model with item features was the winner. In both datasets, the baseline and feature-enhanced models performed similarly in offline metrics (AUC, p@50, MRR). But in my evaluation, the feature-enhanced models were superior for several reasons:
- Models with item features are capable of providing recommendations to cold start items, vastly increasing the number of possible beers to recommend in both datasets. This capability is not implemented on Brewtiful, but it would be easy to do so. In a real production scenario, this would probably immediately declare the feature-enhanced model as the winner.
- Item-item recommendations were heuristically better with the feature-enhanced model in both evaluations.
- Item coverage was much better for the feature-enhanced models. Item-enhanced models were not "afraid" to recommend more niche items with fewer reviews if they were more closely aligned with user tastes - it is a well-known problem with standard MF models that popular items can dominate recommendations without some form of remediation.

## Dataset Characteristics (Sparsity)
The glaring difference is that production dataset is much more sparse. The table below compares the basic features of the datasets. Note that all entries are from the dataset after filtering/processing (following the same process).

| | Kaggle Data | Prod Data |
|-|-------------|-----------|
|**Size**| 1,418,686 | 2,091,091 |
|**User Count**|14,646|11,596|
|**Item Count**|22,378|70,646|
|**Sparsity**|0.00511|0.00255|

| | Demo Model (Item Features) | Prod Model (Item Features) |
|-|-------------|-----------|
|**AUC**| 0.902 | 0.917 |
|**Popularity Baseline p@50**|0.0724|0.0437|
|**LightFM p@50**|0.174|0.10508273|
|**MRR**|0.467|0.300|
|**Item Coverage@100**|~33%|~60%|

It's easy to see that there are more users and many fewer items in the Kaggle dataset, leading to an interaction matrix which is roughly twice as dense as the production data. Predictably, this led to consistently worse offline metrics during model training in prod. The model trained on the Kaggle data learned a more robust signal compared to the production model.

Otherwise, the two datasets are very similar in terms of ratings distributions (positive skew) and user rating patterns (some very popular items, many long tail items/some power users, many less active users). However, the production dataset has many more items so the model is capable of recommending a wide variety of items, and the production model's item coverage is much higher.

## A Concluding Remark
It's extremely worth pointing out that my production recommendation system does not use pure LightFM to serve recommendations and the offline metrics are therefore of extremely limited use. A proper evaluation of both models would mirror the production recommendation system (using k-means), but I was not prepared to implement evaluation for this model as regretfully,

- I only learned that the k-means model was necessary after training the models, and
- it would be too labour-intensive to go back and do it now!

However, it would be highly interesting to implement proper offline evaluation for the production model to see how it would perform. An interesting question is whether the feature-enhanced model or the base model provides better embeddings for the k-means model - I operated under the assumption that the feature-enhanced model generates more "sensible" neighbourhoods by including style and brewery data, but perhaps the base model is more capable of generating "serendipitous" recommendations. It would be worth exploring this question.