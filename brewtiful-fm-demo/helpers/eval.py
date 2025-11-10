from lightfm import LightFM
import numpy as np
import pandas as pd

def item_coverage(model, interactions, item_features=None, k=10, threshold=0):
    """
    Calculate item coverage for a LightFM model.
    
    Args:
        model: Trained LightFM model
        interactions: sparse user-item interaction matrix
        item_features: item features to use for predictions
        k: top-k recommendations to consider
        threshold: min score threshold for valid recommendation
    
    Returns:
        coverage: fraction of items that appear in recommendations
    """
    n_users, n_items = interactions.shape
    recommended_items = set()
    
    # Get predictions for all users
    for user_id in range(n_users):
        # Score all items for this user
        scores = model.predict(user_id, np.arange(n_items), item_features=item_features)
        
        # Get top-k items above threshold
        top_items = np.argsort(-scores)[:k]
        valid_items = top_items[scores[top_items] > threshold]
        
        recommended_items.update(valid_items)
    
    coverage = len(recommended_items) / n_items
    return coverage

def get_top_items(model, interactions, user, item_features=None, k=10):
    """
    Get top-k items for a user, excluding items they've already seen.

    Args:
        model: Trained LightFM model
        interactions: sparse user-item interaction matrix
        user: the user whose items to predict
        item_features: item features to use for predictions
        k: top-k recommendations to consider
    """
    n_items = interactions.shape[1]

    # Get items the user has already seen
    seen_items = interactions.getrow(user).nonzero()[1]

    # Get scores for all items
    scores = model.predict(user, np.arange(n_items), item_features=item_features)

    # Set scores of seen items to a very low value to exclude them
    scores[seen_items] = -np.inf

    # Get top-k items (excluding seen items)
    top_items = np.argsort(-scores)[:k]

    return top_items

def show_top_items(model, interactions, user, dataset, inv_mappings, item_features=None, k=10):
    beer_ids = []
    for id in get_top_items(model, interactions, user, item_features=item_features, k=k):
        beer_ids.append(inv_mappings[id])

    # Create rank column to preserve recommendation order
    rank_df = pd.DataFrame({'beer_id': beer_ids, 'rank': range(1, len(beer_ids) + 1)})

    # Filter, aggregate, flatten columns, merge with rank, and sort by rank
    result = (
        dataset[dataset['beer_id'].isin(beer_ids)][['beer_id', 'beer_name', 'style', 'brewery', 'rating']]
        .groupby(['beer_id', 'beer_name', 'style', 'brewery'], as_index=False)
        .agg({'rating': ['mean', 'count']})
    )

    # Flatten the MultiIndex columns
    result.columns = ['beer_id', 'beer_name', 'style', 'brewery', 'rating_mean', 'rating_count']

    # Merge with rank and sort
    result = (
        result
        .merge(rank_df, on='beer_id')
        .sort_values('rank')
        .drop('rank', axis=1)
        .reset_index(drop=True)
    )

    return result

def serve_user_beers(beers, e, b, item_mappings, inv_item_mappings,
                     item_features=False, weights=None):
    """
    Generate a "user" embedding based off of their rated beers.

    Args:
    -beers: list of beer ids summed to generate the embedding
    -e: item embeddigns from LightFM model
    -i: item biases from LightFM model
    -item_mapping: provided id to model id mapping
    -inv_item_mapping: model id to item id mapping
    -dataset: dataset to show resulting beers
    -item_features: use item features?
    -weights: list of weights to generate item embedding. if none provided, weight all equally.
    """
    weights = np.ones(len(beers))

    if item_features:
        user = np.zeros(103)
    else:
        user = np.zeros(73)

    ids = [item_mappings[id] for id in beers]
    for id in ids:
        user += e[id]
    user = user / np.linalg.norm(user)
    
    original_ids = []
    scores = e @ user + b
    scores[ids] -= np.inf
    ranks = np.argsort(scores)
    for id in ranks[-10:]:
        original_ids.append(inv_item_mappings[id])
    
    return original_ids

def serve_similar_beers(beer, e, item_mappings, inv_item_mappings):
    """
    Find similar beers to a given beer based on item embeddings.

    Args:
    -beers: list of beer ids summed to generate the embedding
    -e: item embeddigns from LightFM model
    -i: item biases from LightFM model
    -item_mapping: provided id to model id mapping
    -inv_item_mapping: model id to item id mapping
    -dataset: dataset to show resulting beers
    -item_features: use item features?
    -weights: list of weights to generate item embedding. if none provided, weight all equally.
    """
    
    original_ids = []
    scores = e @ e[item_mappings[beer]]
    scores[item_mappings[beer]] -= np.inf
    ranks = np.argsort(scores)
    for id in ranks[-10:]:
        original_ids.append(inv_item_mappings[id])
    
    return original_ids

def show_beers(beers, dataset):
    return (dataset[dataset['beer_id'].isin(beers)]
            .groupby(['beer_id', 'beer_name', 'style', 'brewery'], as_index=False)['rating']
            .agg(['count', 'mean'])
            )
