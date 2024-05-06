def drop_columns(df, row_names_column_name, collection_column_names):
    return df.drop([row_names_column_name] + collection_column_names, axis=1)


def extract_columns(df, row_names_column_name, collection_column_names):
    return df[[row_names_column_name] + collection_column_names]
