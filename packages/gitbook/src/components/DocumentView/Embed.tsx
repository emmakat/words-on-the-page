import * as gitbookAPI from '@gitbook/api';
import { headers } from 'next/headers';
import Script from 'next/script';
import ReactDOM from 'react-dom';

import { Card } from '@/components/primitives';
import { getEmbedByUrlInSpace, getEmbedByUrl } from '@/lib/api';
import { getGitBookContextFromHeaders } from '@/lib/gitbook-context';
import { tcls } from '@/lib/tailwind';

import { BlockProps } from './Block';
import { Caption } from './Caption';
import { IntegrationBlock } from './Integration';

export async function Embed(props: BlockProps<gitbookAPI.DocumentBlockEmbed>) {
    const ctx = getGitBookContextFromHeaders(await headers());
    const { block, context, ...otherProps } = props;
    const nonce = ctx.nonce || undefined;

    ReactDOM.preload('https://cdn.iframe.ly/embed.js', { as: 'script', nonce });

    const embed = await (context.content
        ? getEmbedByUrlInSpace(ctx, context.content.spaceId, block.data.url)
        : getEmbedByUrl(ctx, block.data.url));

    return (
        <Caption {...props}>
            {embed.type === 'rich' ? (
                <>
                    <div
                        dangerouslySetInnerHTML={{
                            __html: embed.html,
                        }}
                    />
                    <Script src="https://cdn.iframe.ly/embed.js" nonce={nonce} />
                </>
            ) : embed.type === 'integration' ? (
                <IntegrationBlock
                    {...otherProps}
                    context={context}
                    block={createIntegrationBlock(block.data.url, embed.integration, embed.block)}
                />
            ) : (
                <Card
                    leadingIcon={
                        embed.icon ? (
                            <img src={embed.icon} className={tcls('w-5', 'h-5')} alt="Logo" />
                        ) : null
                    }
                    href={block.data.url}
                    title={embed.title}
                    postTitle={embed.site}
                />
            )}
        </Caption>
    );
}

/**
 * Create an integration block with an unfurl action from the GitBook Embed response.
 */
function createIntegrationBlock(
    url: string,
    integration: string,
    block: gitbookAPI.IntegrationBlock,
): gitbookAPI.DocumentBlockIntegration {
    return {
        object: 'block',
        type: 'integration',
        isVoid: true,
        data: {
            integration,
            block: block.id,
            props: {},
            action: {
                action: '@link.unfurl',
                url,
            },
            url,
        },
    };
}
